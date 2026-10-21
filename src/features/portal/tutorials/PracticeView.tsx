"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, FileQuestion, LockKeyhole, XCircle } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { EmptyPanel, ErrorState } from "@/components/ui/State";
import { useLesson, useSubscription } from "@/hooks/usePortalData";
import { getPracticeQuestions } from "@/data/practice";
import { canOpenLesson } from "@/services/access";
import { isMockMode } from "@/lib/config";

export default function PracticeView({ lessonId }: { lessonId: string }) {
  const lessonQuery = useLesson(lessonId);
  const { access, refetch: refetchAccess } = useSubscription();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const lesson = lessonQuery.data;
  const questions = isMockMode() ? getPracticeQuestions(lessonId) : [];
  const score = questions.filter((question) => answers[question.id] === question.answer).length;
  const external = lesson?.assessment && /^https?:\/\//i.test(lesson.assessment.url) ? lesson.assessment.url : null;
  const backHref = `/tutorials/${lessonId}`;

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-8 sm:py-9">
        <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--primary-color)] hover:bg-indigo-50">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to lesson
        </Link>

        {lessonQuery.isPending || access === "loading" ? (
          <div role="status" className="mt-6 skeleton h-64 rounded-2xl">
            <span className="sr-only">Loading practice</span>
          </div>
        ) : lessonQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <ErrorState message="We could not load this practice set." onRetry={() => void lessonQuery.refetch()} />
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
        ) : !lesson || !lesson.assessment ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <EmptyPanel icon={FileQuestion} title="No practice for this lesson" message="CBT practice hasn't been added to this lesson yet." />
          </div>
        ) : external ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900">{lesson.assessment.label}</h1>
            <p className="mt-2 text-sm text-slate-600">This practice opens in the CBT centre.</p>
            <a href={external} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white">
              Open practice <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
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
