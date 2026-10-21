import { apiClient } from "@/lib/api-client";
import { curriculumFixtures } from "@/data/curriculum";
import {
  CurriculumUnavailableError,
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

class CatalogRepository implements CurriculumRepository {
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
    const catalog = await this.catalog();
    for (const subject of catalog) for (const term of subject.terms) for (const week of term.weeks) {
      const found = week.lessons.find((item) => item.id === lessonId);
      if (found) return found;
    }
    return null;
  }
}

const mockRepository = new CatalogRepository(async () => curriculumFixtures);
const apiRepository = new CatalogRepository(async () => {
  const endpoint = process.env.NEXT_PUBLIC_CURRICULUM_API_PATH;
  if (!endpoint) throw new CurriculumUnavailableError("API curriculum mode is enabled, but NEXT_PUBLIC_CURRICULUM_API_PATH is missing.");
  const data = await apiClient.get<CurriculumSubject[]>(endpoint);
  if (!Array.isArray(data)) throw new CurriculumUnavailableError("The curriculum API returned an unsupported response.");
  return data;
});

export const getCurriculumRepository = (): CurriculumRepository =>
  process.env.NEXT_PUBLIC_CURRICULUM_SOURCE === "api" ? apiRepository : mockRepository;

export const isMockCurriculum = () => process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api";
