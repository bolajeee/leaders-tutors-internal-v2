import { liveCall } from "@/lib/live-api";
import { isRecord, text } from "@/services/live-account";
import type { CbtQuestion, CbtQuizSession, CbtSummary, PracticeQuestion } from "@/types/cbt";

type Raw = Record<string, unknown>;

const rows = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter(isRecord) : isRecord(value) ? [value] : [];

const numberValue = (source: Raw, keys: string[]) => {
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const parseDuration = (value: string): number => {
  const match = /^(\d+):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

/** Formats a seconds count as the API's HH:MM:SS duration string. */
export const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};

const plainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const optionText = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") return plainText(String(value));
  return isRecord(value) ? plainText(text(value, ["option", "text", "label", "answer"])) : "";
};

const optionsFor = (question: Raw) => {
  const rawOptions = question.options ?? question.answers ?? question.choices;
  const listed = (Array.isArray(rawOptions) ? rawOptions : [])
    .map(optionText)
    .filter(Boolean);
  if (listed.length) return listed;

  return ["a", "b", "c", "d", "e"]
    .map((letter) => plainText(text(question, [`option_${letter}`, `option${letter.toUpperCase()}`, letter.toUpperCase()])))
    .filter(Boolean);
};

const answerIndex = (value: unknown, options: string[]) => {
  const raw = String(value ?? "").trim();
  if (!raw) return -1;
  const letter = raw.match(/^(?:option[_ -]?)?([a-e])$/i)?.[1];
  if (letter) return letter.toLowerCase().charCodeAt(0) - 97;
  const matchingText = options.findIndex((option) => option.toLowerCase() === raw.toLowerCase());
  if (matchingText >= 0) return matchingText;
  const numeric = Number(raw);
  if (!Number.isInteger(numeric)) return -1;
  if (numeric === 0) return 0;
  return numeric >= 1 && numeric <= options.length ? numeric - 1 : -1;
};

const mapQuestion = (question: Raw, index: number): PracticeQuestion | null => {
  const prompt = plainText(text(question, ["question", "question_text", "prompt", "title"]));
  const options = optionsFor(question);
  const answer = answerIndex(
    question.correct_answer ?? question.correct_option ?? question.answer ?? question.answer_key,
    options,
  );
  if (!prompt || options.length < 2 || answer < 0 || answer >= options.length) return null;
  return {
    id: text(question, ["question_id", "cbt_question_id", "id"], `question-${index + 1}`),
    prompt,
    options,
    answer,
    explanation: plainText(text(question, ["explanation", "solution", "answer_explanation"])),
  };
};

const questionRows = (reply: Raw, summary: Raw) => {
  const sources = [
    summary.questions,
    summary.cbt_questions,
    summary.quiz_questions,
    summary.data,
    reply.questions,
    reply.cbt_questions,
    reply.quiz_questions,
    reply.data,
  ];
  return sources.flatMap(rows);
};

export const normalizeCbtQuestions = (reply: Raw): PracticeQuestion[] => {
  const container = rows(reply.data ?? reply.question ?? reply.questions ?? reply.quiz)[0] ?? reply;
  const candidates = questionRows(reply, container);
  // Some responses put question rows directly in `data` without a summary wrapper.
  const directRows = rows(reply.data).filter((row) =>
    Boolean(text(row, ["question", "question_text", "prompt"])),
  );
  const seen = new Set<string>();
  return [...candidates, ...directRows]
    .map(mapQuestion)
    .filter((question): question is PracticeQuestion => Boolean(question))
    .filter((question) => {
      if (seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
};

/** Fetches the live CBT attached to one tutorial and normalizes its summary/questions. */
export const fetchCbtSummary = async (tutorialId: string): Promise<CbtSummary | null> => {
  const reply = await liveCall("/user/cbt/fetch-cbt-summary", { tutorial_id: tutorialId });
  const summary = rows(reply.data ?? reply.summary ?? reply.cbt_summary ?? reply.cbt)[0] ?? reply;
  const questions = normalizeCbtQuestions(reply);
  const questionCount =
    numberValue(summary, ["quiz_question_counts", "question_count", "total_questions", "all_record_count"]) ||
    numberValue(reply, ["quiz_question_counts", "question_count", "total_questions", "all_record_count"]) ||
    questions.length;
  const externalUrl = text(summary, ["cbt_url", "quiz_url", "launch_url", "url", "link"]);

  if (questionCount <= 0 && questions.length === 0 && !externalUrl) return null;

  const durationSeconds =
    parseDuration(text(summary, ["quiz_duration"])) || parseDuration(text(reply, ["quiz_duration"]));

  return {
    assessment: {
      label: text(summary, ["title", "cbt_title", "quiz_title", "name"], "Take CBT practice"),
      url: externalUrl || `/tutorials/${tutorialId}/practice`,
      questionCount: questionCount || undefined,
    },
    questions,
    durationSeconds,
  };
};

/** The API fills empty image slots with this stock filename; it isn't a real upload. */
const PLACEHOLDER_IMAGE = "avatar.jpg";

const fileUrl = (folder: string, file: string) => {
  if (!file || file.toLowerCase() === PLACEHOLDER_IMAGE) return undefined;
  if (/^(?:https?:)?\/\//i.test(file) || !folder) return file;
  return `${folder.replace(/\/+$/, "")}/${file.replace(/^\/+/, "")}`;
};

/** Starts a new attempt or resumes the student's existing attempt for this tutorial. */
export const startResumeQuiz = async (tutorialId: string, durationSeconds: number): Promise<CbtQuizSession> => {
  const reply = await liveCall("/user/cbt/start-resume-quiz", { tutorial_id: tutorialId });
  const buttons = rows(reply.buttons).flatMap((button) => {
    const questionId = text(button, ["question_id"]);
    if (!questionId) return [];
    return [{
      number: numberValue(button, ["display_question_no"]) || 1,
      questionId,
      attempted: text(button, ["attempted"]).toLowerCase() === "yes",
    }];
  });
  const displayQuestionId = text(reply, ["display_question_id", "question_id"]) || buttons[0]?.questionId || "";
  if (!displayQuestionId) throw new Error("The CBT started but did not return a question.");
  return {
    tutorialId: text(reply, ["tutorial_id"], tutorialId),
    displayQuestionNo: numberValue(reply, ["display_question_no"]) || buttons.find((item) => item.questionId === displayQuestionId)?.number || 1,
    displayQuestionId,
    buttons,
    durationSeconds,
  };
};

const mapCbtQuestion = (reply: Raw): CbtQuestion | null => {
  const question = rows(reply.questions ?? reply.question ?? reply.data)[0];
  if (!question) return null;
  const id = text(reply, ["question_id"]) || text(question, ["question_id", "id"]);
  const prompt = plainText(text(question, ["question_text", "question", "prompt"]));
  if (!id || !prompt) return null;
  const options = rows(question.options).flatMap((option) => {
    const optionId = text(option, ["option_id", "id"]);
    const label = plainText(text(option, ["option_text", "text", "option"]));
    if (!optionId || !label) return [];
    return [{
      id: optionId,
      text: label,
      imageUrl: fileUrl(text(option, ["optionsStoragePath", "options_storage_path"]), text(option, ["option_pix", "image"])),
    }];
  });
  const selected = question.selected_option;
  const selectedOptionId = isRecord(selected)
    ? text(selected, ["option_id", "id"])
    : typeof selected === "string" || typeof selected === "number"
      ? String(selected)
      : "";
  return {
    id,
    prompt,
    imageUrl: fileUrl(text(question, ["questionsStoragePath", "questions_storage_path"]), text(question, ["question_pix", "image"])),
    options,
    selectedOptionId: selectedOptionId || undefined,
  };
};

/** Fetches one server-controlled question from the active tutorial attempt. */
export const fetchQuizQuestion = async (
  session: CbtQuizSession,
  questionId = session.displayQuestionId,
  availableTimeSeconds = session.durationSeconds,
) => {
  const reply = await liveCall("/user/cbt/fetch-quiz-question", {
    tutorial_id: session.tutorialId,
    question_id: questionId,
    available_time: formatDuration(availableTimeSeconds),
  });
  const question = mapCbtQuestion(reply);
  if (!question) throw new Error("The CBT question could not be read.");
  return question;
};

export const pickQuizOption = async ({
  tutorialId,
  questionId,
  optionId,
}: {
  tutorialId: string;
  questionId: string;
  optionId: string;
}) => {
  await liveCall("/user/cbt/pick-quiz-option", {
    tutorial_id: tutorialId,
    question_id: questionId,
    option_id: optionId,
  });
};

export const startOrResumeCbt = async (tutorialId: string, durationSeconds: number) => {
  const session = await startResumeQuiz(tutorialId, durationSeconds);
  return { session, question: await fetchQuizQuestion(session) };
};
