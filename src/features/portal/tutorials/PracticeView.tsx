"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, FileQuestion, LockKeyhole, XCircle } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { EmptyPanel, ErrorState } from "@/components/ui/State";
import { useCbtQuiz, useCbtSummary, useLesson, useSubscription } from "@/hooks/usePortalData";
import { getPracticeQuestions } from "@/data/practice";
import { canOpenLesson } from "@/services/access";
import { isMockMode } from "@/lib/config";
import { fetchQuizQuestion, pickQuizOption } from "@/services/cbt";
import type { CbtQuestion, CbtQuizSession } from "@/types/cbt";

function LiveCbtPractice({
  lessonTitle,
  session,
  initialQuestion,
}: {
  lessonTitle: string;
  session: CbtQuizSession;
  initialQuestion: CbtQuestion;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [selectedOptionId, setSelectedOptionId] = useState(initialQuestion.selectedOptionId ?? "");
  const [attempted, setAttempted] = useState(
    () => new Set(session.buttons.filter((button) => button.attempted).map((button) => button.questionId)),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const currentButton = session.buttons.find((button) => button.questionId === question.id);
  const isAttempted = attempted.has(question.id);

  const openQuestion = async (questionId: string) => {
    setBusy(true);
    setError("");
    try {
      const next = await fetchQuizQuestion(session, questionId);
      setQuestion(next);
      setSelectedOptionId(next.selectedOptionId ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The question could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedOptionId || isAttempted) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await pickQuizOption({
        tutorialId: session.tutorialId,
        questionId: question.id,
        optionId: selectedOptionId,
      });
      const nextAttempted = new Set(attempted).add(question.id);
      setAttempted(nextAttempted);
      const next = session.buttons.find((button) => !nextAttempted.has(button.questionId));
      if (next) {
        setMessage("Answer saved. Loading the next question…");
        const nextQuestion = await fetchQuizQuestion(session, next.questionId);
        setQuestion(nextQuestion);
        setSelectedOptionId(nextQuestion.selectedOptionId ?? "");
      } else {
        setMessage("All questions have been attempted. Well done.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your answer could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-hover-color)]">CBT practice</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{lessonTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Question {currentButton?.number ?? session.displayQuestionNo} of {session.buttons.length}
        </p>
      </header>

      {session.buttons.length > 1 && (
        <nav aria-label="CBT questions" className="flex flex-wrap gap-2">
          {session.buttons.map((button) => {
            const active = button.questionId === question.id;
            const done = attempted.has(button.questionId);
            return (
              <button
                key={button.questionId}
                type="button"
                disabled={busy}
                aria-current={active ? "step" : undefined}
                aria-label={`Question ${button.number}${done ? ", attempted" : ""}`}
                onClick={() => void openQuestion(button.questionId)}
                className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${
                  active
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                    : done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {button.number}
              </button>
            );
          })}
        </nav>
      )}

      {message && <p role="status" className="rounded-xl bg-indigo-50 p-4 text-sm font-semibold text-slate-900">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitAnswer();
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <fieldset disabled={busy || isAttempted}>
          <legend className="text-base font-semibold leading-7 text-slate-900">{question.prompt}</legend>
          {question.imageUrl && (
            // CBT images are served by the upload host, outside next/image's allow-list.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.imageUrl} alt="Question illustration" className="mt-4 max-h-64 w-full rounded-xl object-contain" />
          )}
          <div className="mt-4 space-y-3">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                  selectedOptionId === option.id
                    ? "border-[var(--primary-color)] bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  onChange={() => setSelectedOptionId(option.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--primary-color)]"
                />
                {option.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={option.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <span className="min-w-0 flex-1">{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={busy || isAttempted || !selectedOptionId}
          className="mt-5 min-h-11 w-full rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : isAttempted ? "Question attempted" : "Submit answer"}
        </button>
      </form>
    </div>
  );
}

export default function PracticeView({ lessonId }: { lessonId: string }) {
  const lessonQuery = useLesson(lessonId);
  const { access, refetch: refetchAccess } = useSubscription();
  const cbtQuery = useCbtSummary(lessonId, access === "active");
  const liveAssessment = cbtQuery.data?.assessment;
  const hasExternalCbt = Boolean(liveAssessment && /^https?:\/\//i.test(liveAssessment.url));
  const shouldLoadLiveQuiz =
    access === "active" && cbtQuery.isSuccess && Boolean(cbtQuery.data) && !hasExternalCbt;
  const quizQuery = useCbtQuiz(lessonId, shouldLoadLiveQuiz);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const lesson = lessonQuery.data;
  const questions = isMockMode() ? getPracticeQuestions(lessonId) : [];
  const score = questions.filter((question) => answers[question.id] === question.answer).length;
  const assessment = lesson?.assessment ?? cbtQuery.data?.assessment;
  const external = assessment && /^https?:\/\//i.test(assessment.url) ? assessment.url : null;
  const backHref = `/tutorials/${lessonId}`;

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-8 sm:py-9">
        <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--primary-color)] hover:bg-indigo-50">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to lesson
        </Link>

        {lessonQuery.isPending ||
        access === "loading" ||
        (!isMockMode() && (cbtQuery.isPending || (shouldLoadLiveQuiz && quizQuery.isPending))) ? (
          <div role="status" className="mt-6 skeleton h-64 rounded-2xl">
            <span className="sr-only">Loading practice</span>
          </div>
        ) : lessonQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <ErrorState message="We could not load this practice set." onRetry={() => void lessonQuery.refetch()} />
          </div>
        ) : cbtQuery.isError || (shouldLoadLiveQuiz && quizQuery.isError) ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <ErrorState
              message="We could not start or resume this CBT practice."
              onRetry={() => void (cbtQuery.isError ? cbtQuery.refetch() : quizQuery.refetch())}
            />
          </div>
        ) : access === "error" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50">
            <ErrorState title="We couldn't confirm your subscription" message="Practice stays locked until your access is confirmed." onRetry={() => void refetchAccess()} />
          </div>
        ) : !canOpenLesson(access) ? (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
            <LockKeyhole className="mx-auto h-9 w-9 text-orange-700" aria-hidden />
            <h1 className="mt-3 text-xl font-semibold text-slate-900">Renew to open practice</h1>
            <Link href="/subscriptions" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--secondary-color)] px-5 text-sm font-semibold text-slate-950">
              Manage subscription
            </Link>
          </div>
        ) : !lesson || !assessment ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <EmptyPanel icon={FileQuestion} title="No practice for this lesson" message="CBT practice hasn't been added to this lesson yet." />
          </div>
        ) : external ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900">{assessment.label}</h1>
            <p className="mt-2 text-sm text-slate-600">This practice opens in the CBT centre.</p>
            <a href={external} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white">
              Open practice <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        ) : !isMockMode() && quizQuery.data ? (
          <LiveCbtPractice
            lessonTitle={lesson.title}
            session={quizQuery.data.session}
            initialQuestion={quizQuery.data.question}
          />
        ) : questions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <EmptyPanel icon={FileQuestion} title="Questions are being prepared" message="Check back soon for this lesson's practice questions." />
          </div>
        ) : (
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <header>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-hover-color)]">CBT practice</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">{lesson.title}</h1>
            </header>

            {submitted && (
              <p role="status" className="rounded-2xl bg-indigo-50 p-4 text-sm font-semibold text-slate-900">
                You scored {score} out of {questions.length}.
              </p>
            )}

            {questions.map((question, index) => (
              <fieldset key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-sm font-semibold text-slate-900">
                  {index + 1}. {question.prompt}
                </legend>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const chosen = answers[question.id] === optionIndex;
                    const correct = submitted && optionIndex === question.answer;
                    const wrong = submitted && chosen && !correct;
                    return (
                      <label
                        key={option}
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm ${
                          correct ? "border-emerald-300 bg-emerald-50" : wrong ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={optionIndex}
                          checked={chosen}
                          disabled={submitted}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                          className="h-4 w-4 accent-[var(--primary-color)]"
                        />
                        <span className="flex-1">{option}</span>
                        {correct && <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-label="Correct answer" />}
                        {wrong && <XCircle className="h-4 w-4 text-red-700" aria-label="Your answer was incorrect" />}
                      </label>
                    );
                  })}
                </div>
                {submitted && <p className="mt-3 text-xs leading-5 text-slate-600">{question.explanation}</p>}
              </fieldset>
            ))}

            {submitted ? (
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-800"
              >
                Try again
              </button>
            ) : (
              <button
                type="submit"
                disabled={Object.keys(answers).length < questions.length}
                className="min-h-11 rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Submit answers
              </button>
            )}
          </form>
        )}
      </div>
    </PortalWrapper>
  );
}
