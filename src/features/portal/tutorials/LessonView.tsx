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
        {lessonQuery.isPending ? (
          <>
            {back}
            <div role="status" className="mt-6 space-y-4">
              <div className="skeleton aspect-video rounded-2xl" />
              <div className="skeleton h-24 rounded-2xl" />
              <span className="sr-only">Loading lesson</span>
            </div>
          </>
        ) : lessonQuery.isError ? (
          <>
            {back}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
              <ErrorState
                title="Lesson unavailable"
                message={lessonQuery.error instanceof Error ? lessonQuery.error.message : "We could not load this lesson."}
                onRetry={() => void lessonQuery.refetch()}
              />
            </div>
          </>
        ) : !lesson ? (
          <>
            {back}
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
          </>
        ) : (
          <div className="flex flex-col">
            <div className={unlocked ? "hidden sm:order-1 sm:block" : "order-1"}>{back}</div>
            <header className={`${unlocked ? "hidden sm:order-2 sm:block" : "order-2"} mt-5`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-hover-color)]">
                {lesson.subjectName} · {lesson.termLabel} · {lesson.weekLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{lesson.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{lesson.subjectName}</Badge>
                <Badge tone="neutral">{lesson.termLabel}</Badge>
                <Badge tone="neutral">{lesson.weekLabel}</Badge>
                {lesson.duration && (
                  <Badge tone="warning">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    <span className="sr-only">Duration </span>
                    {lesson.duration}
                  </Badge>
                )}
              </div>
            </header>

            {unlocked && (
              <div className="order-1 -mx-4 flex min-h-22 items-center gap-3 border-y border-indigo-100 bg-white px-4 py-3 sm:hidden">
                <Link
                  href="/tutorials"
                  aria-label="Back to tutorials"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-[var(--primary-color)]"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Now watching</p>
                  <p className="mt-0.5 truncate text-lg font-semibold text-[var(--primary-color)]">{lesson.title}</p>
                </div>
              </div>
            )}

            {access === "loading" ? (
              <div role="status" className="order-3 mt-7 skeleton aspect-video rounded-2xl">
                <span className="sr-only">Checking your subscription</span>
              </div>
            ) : access === "error" ? (
              <div className="order-3 mt-7 rounded-2xl border border-amber-200 bg-amber-50">
                <ErrorState
                  title="We couldn't confirm your subscription"
                  message="This lesson stays locked until your access is confirmed."
                  onRetry={() => void refetchAccess()}
                />
              </div>
            ) : !unlocked ? (
              <div className="order-3 mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center sm:p-10">
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
                <div className="order-2 -mx-4 flex min-h-[calc(100dvh-9.25rem)] flex-col justify-center gap-4 bg-slate-950 px-4 py-8 sm:order-3 sm:mx-0 sm:mt-7 sm:block sm:min-h-0 sm:overflow-hidden sm:rounded-2xl sm:p-0 sm:shadow-xl">
                  <div className="w-full overflow-hidden rounded-2xl sm:rounded-none">
                    <SecureVideoPlayer src={lesson.videoUrl} poster={lesson.thumbnailUrl} title={lesson.title} />
                  </div>
                  {lesson.materials.length > 0 && (
                    <div className="space-y-2 sm:hidden" aria-label="Tutorial materials">
                      {lesson.materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-[var(--primary-color)] shadow-lg"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50">
                            <Download className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 truncate">Tutorial material</span>
                          <span className="shrink-0 text-xs uppercase">Open</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="order-3 mt-5 grid gap-4 sm:order-4 sm:mt-6 sm:gap-5 lg:grid-cols-[1fr_320px]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="sm:hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand">{lesson.subjectName}</Badge>
                        <Badge tone="neutral">{lesson.termLabel}</Badge>
                        {lesson.duration && (
                          <Badge tone="warning">
                            <Clock3 className="h-3 w-3" aria-hidden />
                            {lesson.duration}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-slate-900">{lesson.title}</p>
                      <div className="my-5 border-t border-slate-100" />
                    </div>
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
                    <section className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:block">
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
          </div>
        )}
      </div>
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
    </PortalWrapper>
  );
}
