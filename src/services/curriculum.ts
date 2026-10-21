import { curriculumFixtures } from "@/data/curriculum";
import { isMockMode } from "@/lib/config";
import { LiveCurriculumRepository } from "@/services/live-curriculum";
import {
  type AcademicTerm,
  type CurriculumRepository,
  type CurriculumSubject,
  type CurriculumWeek,
  type Lesson,
} from "@/types/curriculum";

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

/** Serves a complete in-memory catalog; used for the demo fixtures. */
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
const liveRepository = new LiveCurriculumRepository();

/** The live repository never falls back to fixtures: a failure is shown, not hidden. */
export const getCurriculumRepository = (): CurriculumRepository =>
  isMockMode() ? mockRepository : liveRepository;

export { isMockMode as isMockCurriculum };

/** Topics in a subject. Terms whose weeks have not been opened yet report their declared count. */
export const countLessons = (subject: CurriculumSubject) =>
  subject.terms.reduce(
    (total, term) =>
      total + (term.lessonCount ?? term.weeks.reduce((sum, week) => sum + week.lessons.length, 0)),
    0,
  );
