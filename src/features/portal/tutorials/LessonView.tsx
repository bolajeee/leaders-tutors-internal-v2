"use client";

import Link from "next/link";
import { useState } from "react";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Download,
  ExternalLink,
  FileQuestion,
  FileText,
  LockKeyhole,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import SecureVideoPlayer from "@/components/tutorial/SecureVideoPlayer";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { Badge } from "@/components/ui";
import { EmptyPanel, ErrorState } from "@/components/ui/State";
import { useLesson, useSubscription } from "@/hooks/usePortalData";
import { canOpenLesson } from "@/services/access";
import type { AssessmentLink } from "@/types/curriculum";

const isExternal = (url: string) => /^https?:\/\//i.test(url);

function AssessmentAction({ assessment }: { assessment: AssessmentLink }) {
  const className =
    "flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--secondary-color)] px-5 font-semibold text-slate-950 hover:bg-[var(--secondary-hover-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2";
  const body = (
    <>
      <FileQuestion className="h-5 w-5 shrink-0" aria-hidden />
      <span>
        {assessment.label}
        <span className="block text-xs font-normal">
          {assessment.questionCount ? `${assessment.questionCount} practice questions` : "Computer-based practice"}
        </span>
      </span>
      {isExternal(assessment.url) && <ExternalLink className="ml-auto h-4 w-4" aria-hidden />}
    </>
  );
  return isExternal(assessment.url) ? (
    <a href={assessment.url} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
      {" "}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <Link href={assessment.url} className={className}>
      {body}
    </Link>
  );
}

export default function LessonView({ lessonId }: { lessonId: string }) {
  const lessonQuery = useLesson(lessonId);
  const { access, refetch: refetchAccess } = useSubscription();
  const [showRenewal, setShowRenewal] = useState(false);
  const lesson = lessonQuery.data;
  const unlocked = canOpenLesson(access);

  const back = (
    <Link
      href="/tutorials"
      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--primary-color)] hover:bg-indigo-50"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to tutorials
    </Link>
  );

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
        {back}

        {lessonQuery.isPending ? (
          <div role="status" className="mt-6 space-y-4">
            <div className="skeleton aspect-video rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <span className="sr-only">Loading lesson</span>
          </div>
        ) : lessonQuery.isError ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
            <ErrorState
              title="Lesson unavailable"
              message={lessonQuery.error instanceof Error ? lessonQuery.error.message : "We could not load this lesson."}
              onRetry={() => void lessonQuery.refetch()}
            />
          </div>
        ) : !lesson ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
            <EmptyPanel
              icon={BookOpen}
              title="Lesson not found"
              message="This lesson may have moved or is not available yet."
              action={
                <Link href="/tutorials" className="font-semibold text-[var(--primary-color)] underline">
                  Browse tutorials
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <header className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-hover-color)]">
                {lesson.subjectName} · {lesson.termLabel} · {lesson.weekLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{lesson.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{lesson.subjectName}</Badge>
                <Badge tone="neutral">{lesson.termLabel}</Badge>
                <Badge tone="neutral">{lesson.weekLabel}</Badge>
                <Badge tone="warning">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  <span className="sr-only">Duration </span>
                  {lesson.duration}
                </Badge>
              </div>
            </header>

            {access === "loading" ? (
              <div role="status" className="mt-7 skeleton aspect-video rounded-2xl">
                <span className="sr-only">Checking your subscription</span>
              </div>
            ) : access === "error" ? (
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50">
                <ErrorState
                  title="We couldn't confirm your subscription"
                  message="This lesson stays locked until your access is confirmed."
                  onRetry={() => void refetchAccess()}
                />
              </div>
            ) : !unlocked ? (
              <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center sm:p-10">
                <LockKeyhole className="mx-auto h-10 w-10 text-orange-700" aria-hidden />
                <h2 className="mt-4 text-2xl font-semibold text-slate-900">Renew to open this lesson</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-700">
                  Your curriculum stays visible, but lesson video, notes and practice need an active subscription.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRenewal(true)}
                  className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--secondary-color)] px-5 text-sm font-semibold text-slate-950 hover:bg-[var(--secondary-hover-color)] hover:text-white"
                >
                  Renew access
                </button>
              </div>
            ) : (
              <>
                <div className="mt-7 overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
                  <SecureVideoPlayer src={lesson.videoUrl} poster={lesson.thumbnailUrl} title={lesson.title} />
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">About this lesson</h2>
                    {lesson.description ? (
                      <div
                        className="mt-3 text-sm leading-7 text-slate-700 [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.isSupported ? DOMPurify.sanitize(lesson.description) : "" }}
                      />
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-slate-700">{lesson.summary || "No description has been added for this lesson yet."}</p>
                    )}
                  </section>
                  <aside className="space-y-4" aria-label="Lesson resources">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="font-semibold text-slate-900">Notes and materials</h2>
                      {lesson.materials.length ? (
                        <ul className="mt-4 space-y-2">
                          {lesson.materials.map((material) => (
                            <li key={material.id}>
                              <a
                                href={material.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-[var(--primary-color)] hover:bg-indigo-100"
                              >
                                <Download className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="min-w-0 break-words">{material.title}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          No notes have been attached to this lesson yet.
                        </p>
                      )}
                    </section>
                    {lesson.assessment ? (
                      <AssessmentAction assessment={lesson.assessment} />
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
                        CBT practice isn&apos;t available for this lesson yet.
                      </p>
                    )}
                  </aside>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
    </PortalWrapper>
  );
}
