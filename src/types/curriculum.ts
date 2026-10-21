/**
 * Normalized curriculum contracts: subject → term → week → lesson.
 * The UI only ever sees these shapes; API payloads are mapped into them by
 * `normalizeCurriculum` in `src/services/curriculum.ts`.
 */
export type SubscriptionAccess = "active" | "expired";

export interface LessonMaterial {
  id: string;
  title: string;
  url: string;
  kind: "note" | "worksheet" | "reference";
}

export interface AssessmentLink {
  label: string;
  /** In-app path (starts with "/") or an absolute URL for an external CBT. */
  url: string;
  questionCount?: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  termId: string;
  weekId: string;
  /** Denormalized labels so a lesson can be shown without loading its parents. */
  subjectName: string;
  termLabel: string;
  weekLabel: string;
  title: string;
  /** Plain-text summary. */
  summary: string;
  /** Optional rich text (HTML) body; always sanitized before display. */
  description?: string;
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
  /** Course image uploaded for the subject; absent until one is uploaded. */
  imageUrl?: string;
  /** Percentage of the subject's lessons completed (0–100). */
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
