import { coverForSubject } from "@/data/subject-covers";
import { liveCall } from "@/lib/live-api";
import { isRecord, text } from "@/services/live-account";
import type {
  AcademicTerm,
  CurriculumRepository,
  CurriculumSubject,
  CurriculumWeek,
  Lesson,
} from "@/types/curriculum";

type Raw = Record<string, unknown>;

const rows = (value: unknown): Raw[] => (Array.isArray(value) ? value.filter(isRecord) : []);

/** The API shouts its names ("FIRST TERM"); show them as titles. */
const titleCase = (value: string) =>
  value === value.toUpperCase() ? value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : value;

/** Files are stored as a folder URL plus a file name; a complete URL is left alone. */
const fileUrl = (folder: string, file: string) => {
  if (!file) return undefined;
  if (/^(?:https?:)?\/\//i.test(file) || !folder) return file;
  return `${folder.replace(/\/+$/, "")}/${file.replace(/^\/+/, "")}`;
};

const mapSubject = (subject: Raw): CurriculumSubject[] => {
  const id = text(subject, ["subject_id"]);
  const name = titleCase(text(subject, ["subject_name"]));
  if (!id || !name) return [];

  const terms = rows(subject.terms).flatMap((term, index): AcademicTerm[] => {
    const termId = text(term, ["term_id"]);
    if (!termId) return [];
    return [
      {
        id: termId,
        label: titleCase(text(term, ["term_name"], `Term ${index + 1}`)),
        order: index + 1,
        // Weeks are fetched when a term is opened; the count previews what is inside.
        weeks: [],
        lessonCount: Number(term.total_number_of_videos) || 0,
      },
    ];
  });

  return [
    {
      id,
      name,
      description: "",
      imageUrl: text(subject, ["thumbnail_url", "image", "picture"]) || coverForSubject(name),
      terms,
    },
  ];
};

/** Everything the lesson list needs about the subject and term that were asked for. */
interface WeekContext {
  subjectId: string;
  subjectName: string;
  termId: string;
  termLabel: string;
}

const mapWeeks = (data: Raw[], context: WeekContext): CurriculumWeek[] =>
  data.map((week, index): CurriculumWeek => {
    const order = index + 1;
    const weekId = text(week, ["week_id"], `${context.termId}-${context.subjectId}-week-${order}`);
    const label = titleCase(text(week, ["week_name"], `Week ${order}`));

    return {
      id: weekId,
      label,
      order,
      lessons: rows(week.week_videos).flatMap((video): Lesson[] => {
        const id = text(video, ["tutorial_id"]);
        const title = text(video, ["topic"]);
        if (!id || !title) return [];
        return [
          {
            id,
            subjectId: context.subjectId,
            termId: context.termId,
            weekId,
            subjectName: context.subjectName,
            termLabel: context.termLabel,
            weekLabel: label,
            title,
            summary: text(video, ["summary"]),
            // The week list does not carry the length; the lesson page does.
            duration: "",
            thumbnailUrl: fileUrl(text(video, ["documentStoragePath"]), text(video, ["thumbnail"])),
            // Video and notes are fetched with the lesson itself.
            materials: [],
          },
        ];
      }),
    };
  });

/**
 * The student's curriculum from the live API: subjects with their terms up
 * front, then each term's weeks and each lesson on demand, as the existing
 * site does. CBT practice has no in-app equivalent yet, so lessons carry no
 * assessment link.
 */
export class LiveCurriculumRepository implements CurriculumRepository {
  async getSubjects(): Promise<CurriculumSubject[]> {
    const reply = await liveCall<{ subjects?: unknown }>("/user/tutorials/fetch-deparment-class-subjects");
    return rows(reply.subjects).flatMap(mapSubject);
  }

  async getTerms(subjectId: string): Promise<AcademicTerm[]> {
    return (await this.getSubjects()).find((subject) => subject.id === subjectId)?.terms ?? [];
  }

  async getWeeks(subjectId: string, termId: string): Promise<CurriculumWeek[]> {
    const reply = await liveCall<{ data?: unknown; subject_name?: string; term_name?: string }>(
      "/user/tutorials/fetch-deparment-class-subject-weeks",
      { term_id: termId, subject_id: subjectId },
    );
    return mapWeeks(rows(reply.data), {
      subjectId,
      subjectName: titleCase(reply.subject_name ?? ""),
      termId,
      termLabel: titleCase(reply.term_name ?? ""),
    });
  }

  async getLessons(subjectId: string, termId: string, weekId: string): Promise<Lesson[]> {
    return (await this.getWeeks(subjectId, termId)).find((week) => week.id === weekId)?.lessons ?? [];
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    const reply = await liveCall<{ data?: unknown }>("/user/tutorials/fetch-tutorial", { tutorial_id: lessonId });
    const tutorial = rows(reply.data)[0];
    if (!tutorial) return null;

    const title = text(tutorial, ["topic"]);
    const note = fileUrl(text(tutorial, ["documentStoragePath_material"]), text(tutorial, ["material"]));

    return {
      id: text(tutorial, ["tutorial_id"], lessonId),
      subjectId: text(tutorial, ["subject_id"]),
      termId: text(tutorial, ["term_id"]),
      weekId: text(tutorial, ["week_id"]),
      subjectName: titleCase(text(tutorial, ["subject_name"])),
      termLabel: titleCase(text(tutorial, ["term_name"])),
      weekLabel: titleCase(text(tutorial, ["week_name"])),
      title,
      summary: text(tutorial, ["summary"]),
      duration: text(tutorial, ["duration"]),
      videoUrl: fileUrl(text(tutorial, ["documentStoragePath_video"]), text(tutorial, ["video"])),
      thumbnailUrl: fileUrl(text(tutorial, ["documentStoragePath"]), text(tutorial, ["thumbnail"])),
      materials: note ? [{ id: `${lessonId}-note`, title: `${title} lesson note`, url: note, kind: "note" }] : [],
    };
  }
}
