import type { AssessmentLink } from "@/types/curriculum";

export interface PracticeQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Zero-based index into `options`. */
  answer: number;
  explanation: string;
}

export interface CbtSummary {
  assessment: AssessmentLink;
  questions: PracticeQuestion[];
  /** Total time allotted for the quiz, parsed from `quiz_duration` (HH:MM:SS). */
  durationSeconds: number;
}

export interface CbtQuizSession {
  tutorialId: string;
  displayQuestionNo: number;
  displayQuestionId: string;
  buttons: CbtQuestionButton[];
  /** Total time allotted for the quiz, in seconds. */
  durationSeconds: number;
}

export interface CbtQuestionButton {
  number: number;
  questionId: string;
  attempted: boolean;
}

export interface CbtOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface CbtQuestion {
  id: string;
  prompt: string;
  imageUrl?: string;
  options: CbtOption[];
  selectedOptionId?: string;
}
