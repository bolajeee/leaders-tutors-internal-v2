export type SubscriptionAccess = "active" | "expired" | "pending";

export interface LessonMaterial {
  id: string;
  title: string;
  url: string;
  kind: "note" | "worksheet" | "reference";
}

export interface AssessmentLink {
  label: string;
  url: string;
  questionCount?: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  termId: string;
  weekId: string;
  title: string;
  summary: string;
  duration: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  materials: LessonMaterial[];
  assessment?: AssessmentLink;
}

export interface CurriculumWeek {
  id: string;
  label: string;
  order: number;
  lessons: Lesson[];
}

export interface AcademicTerm {
  id: string;
  label: string;
  order: number;
  weeks: CurriculumWeek[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  description: string;
  progress: number;
  terms: AcademicTerm[];
}

export interface CurriculumRepository {
  getSubjects(): Promise<CurriculumSubject[]>;
  getTerms(subjectId: string): Promise<AcademicTerm[]>;
  getWeeks(subjectId: string, termId: string): Promise<CurriculumWeek[]>;
  getLessons(subjectId: string, termId: string, weekId: string): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
}

export class CurriculumUnavailableError extends Error {
  constructor(message = "Curriculum content is not configured for this environment.") {
    super(message);
    this.name = "CurriculumUnavailableError";
  }
}
