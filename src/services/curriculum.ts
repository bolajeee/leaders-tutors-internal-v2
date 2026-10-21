import { apiClient } from "@/lib/api-client";
import { curriculumFixtures } from "@/data/curriculum";
import { coverForSubject } from "@/data/subject-covers";
import { getEndpoints, isMockMode } from "@/lib/config";
import {
  CurriculumUnavailableError,
  type AcademicTerm,
  type AssessmentLink,
  type CurriculumRepository,
  type CurriculumSubject,
  type CurriculumWeek,
  type Lesson,
  type LessonMaterial,
} from "@/types/curriculum";

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const text = (source: Raw, keys: string[], fallback = ""): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

const list = (source: Raw, keys: string[]): Raw[] => {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
};

const orderOf = (source: Raw, index: number) => {
  const value = Number(source.order ?? source.position ?? source.sortOrder);
  return Number.isFinite(value) ? value : index + 1;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** Accepts "12:30" style strings or a number of seconds. */
const formatDuration = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  return typeof value === "string" && value.trim() ? value.trim() : "—";
};

const mapMaterials = (lesson: Raw): LessonMaterial[] => {
  const materials = list(lesson, ["materials", "notes", "resources"]).flatMap(
    (item, index): LessonMaterial[] => {
      const url = text(item, ["url", "href", "file", "link"]);
      if (!url) return [];
      const kind = text(item, ["kind", "type"]);
      return [
        {
          id: text(item, ["id"], `${text(lesson, ["id", "lessonId", "tutorialId"])}-material-${index + 1}`),
          title: text(item, ["title", "name"], "Lesson material"),
          url,
          kind: kind === "worksheet" || kind === "reference" ? kind : "note",
        },
      ];
    },
  );
  if (materials.length) return materials;

  const single = text(lesson, ["materialUrl", "tutorialMaterial", "noteUrl"]);
  return single
    ? [{ id: `${text(lesson, ["id", "lessonId", "tutorialId"])}-note`, title: "Lesson note", url: single, kind: "note" }]
    : [];
};

const mapAssessment = (lesson: Raw): AssessmentLink | undefined => {
  const nested = isRecord(lesson.assessment) ? lesson.assessment : undefined;
  const url = nested ? text(nested, ["url", "href", "link"]) : text(lesson, ["cbtUrl", "assessmentUrl"]);
  if (!url) return undefined;
  const count = Number(nested?.questionCount ?? lesson.questionCount);
  return {
    label: nested ? text(nested, ["label", "title"], "Take CBT practice") : "Take CBT practice",
    url,
    questionCount: Number.isFinite(count) && count > 0 ? count : undefined,
  };
};

export const normalizeLesson = (
  raw: Raw,
  context: { subjectId: string; subjectName: string; termId: string; termLabel: string; weekId: string; weekLabel: string },
): Lesson | null => {
  const id = text(raw, ["id", "lessonId", "tutorialId"]);
  const title = text(raw, ["title", "lessonTitle", "tutorialTitle", "name"]);
  if (!id || !title) return null;

  const description = text(raw, ["description", "tutorialDescription"]);
  const summary = text(raw, ["summary"]) || stripHtml(description);

  return {
    id,
    ...context,
    title,
    summary,
    description: description || undefined,
    duration: formatDuration(raw.duration ?? raw.tutorialDuration),
    videoUrl: text(raw, ["videoUrl", "video", "tutorialVideo"]) || undefined,
    thumbnailUrl: text(raw, ["thumbnailUrl", "thumbnail", "tutorialPicture"]) || undefined,
    materials: mapMaterials(raw),
    assessment: mapAssessment(raw),
  };
};

const unwrap = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    for (const key of ["data", "subjects", "items", "curriculum"]) {
      const value = payload[key];
      if (Array.isArray(value)) return value;
      if (isRecord(value)) return unwrap(value);
    }
  }
  return null;
};

/**
 * Maps a curriculum payload into the normalized subject → term → week → lesson
 * tree. Entries without an id or title are dropped; a payload that is not a
 * list at all is reported as unavailable rather than guessed at.
 */
export const normalizeCurriculum = (payload: unknown): CurriculumSubject[] => {
  const subjects = unwrap(payload);
  if (!subjects) {
    throw new CurriculumUnavailableError("The curriculum service returned an unsupported response.");
  }

  return subjects.filter(isRecord).flatMap((subject): CurriculumSubject[] => {
    const id = text(subject, ["id", "subjectId"]);
    const name = text(subject, ["name", "subjectName", "subject_name"]);
    if (!id || !name) return [];

    const progress = Number(subject.progress);
    const terms = list(subject, ["terms", "academicTerms"])
      .map((term, termIndex): AcademicTerm | null => {
        const termId = text(term, ["id", "termId"]);
        if (!termId) return null;
        const termLabel = text(term, ["label", "name", "termName"], `Term ${termIndex + 1}`);
        const weeks = list(term, ["weeks"])
          .map((week, weekIndex): CurriculumWeek | null => {
            const weekId = text(week, ["id", "weekId"]);
            if (!weekId) return null;
            const weekLabel = text(week, ["label", "name", "weekName"], `Week ${weekIndex + 1}`);
            const lessons = list(week, ["lessons", "tutorials"]).flatMap((lesson) => {
              const mapped = normalizeLesson(lesson, {
                subjectId: id,
                subjectName: name,
                termId,
                termLabel,
                weekId,
                weekLabel,
              });
              return mapped ? [mapped] : [];
            });
            return { id: weekId, label: weekLabel, order: orderOf(week, weekIndex), lessons };
          })
          .filter((week): week is CurriculumWeek => week !== null);
        return { id: termId, label: termLabel, order: orderOf(term, termIndex), weeks };
      })
      .filter((term): term is AcademicTerm => term !== null);

    return [
      {
        id,
        name,
        description: text(subject, ["description", "summary"]),
        imageUrl:
          text(subject, ["imageUrl", "image", "subjectImage", "subject_image", "coverImage", "picture", "thumbnail"]) ||
          coverForSubject(name),
        progress: Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.round(progress))) : 0,
        terms,
      },
    ];
  });
};

const sortCatalog = (subjects: CurriculumSubject[]) =>
  subjects.map((subject) => ({
    ...subject,
    terms: [...subject.terms]
      .sort((a, b) => a.order - b.order)
      .map((term) => ({
        ...term,
        weeks: [...term.weeks].sort((a, b) => a.order - b.order),
      })),
  }));

export class CatalogRepository implements CurriculumRepository {
  constructor(private readonly loadCatalog: () => Promise<CurriculumSubject[]>) {}

  private async catalog() {
    return sortCatalog(await this.loadCatalog());
  }

  async getSubjects() {
    return this.catalog();
  }

  async getTerms(subjectId: string): Promise<AcademicTerm[]> {
    return (await this.catalog()).find((subject) => subject.id === subjectId)?.terms ?? [];
  }

  async getWeeks(subjectId: string, termId: string): Promise<CurriculumWeek[]> {
    return (await this.getTerms(subjectId)).find((term) => term.id === termId)?.weeks ?? [];
  }

  async getLessons(subjectId: string, termId: string, weekId: string): Promise<Lesson[]> {
    return (await this.getWeeks(subjectId, termId)).find((week) => week.id === weekId)?.lessons ?? [];
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    for (const subject of await this.catalog()) {
      for (const term of subject.terms) {
        for (const week of term.weeks) {
          const found = week.lessons.find((item) => item.id === lessonId);
          if (found) return found;
        }
      }
    }
    return null;
  }
}

const mockRepository = new CatalogRepository(async () => curriculumFixtures);

/** Reads the endpoint at call time and never falls back to fixtures. */
const apiRepository = new CatalogRepository(async () => {
  const endpoint = getEndpoints().curriculum;
  if (!endpoint) {
    throw new CurriculumUnavailableError(
      "Subject, term and week content is not available from the learning service yet.",
    );
  }
  return normalizeCurriculum(await apiClient.get<unknown>(endpoint));
});

export const getCurriculumRepository = (): CurriculumRepository =>
  isMockMode() ? mockRepository : apiRepository;

export { isMockMode as isMockCurriculum };

export const countLessons = (subject: CurriculumSubject) =>
  subject.terms.reduce(
    (total, term) => total + term.weeks.reduce((sum, week) => sum + week.lessons.length, 0),
    0,
  );
