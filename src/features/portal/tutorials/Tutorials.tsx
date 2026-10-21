"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import SubjectImage from "@/components/ui/SubjectImage";
import { EmptyPanel, ErrorState, ExpiredNotice, LoadingRows } from "@/components/ui/State";
import { useCurriculum, useSubscription } from "@/hooks/usePortalData";
import { countLessons } from "@/services/curriculum";
import CourseModal from "./CourseModal";

export default function Tutorials() {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject");
  const curriculum = useCurriculum();
  const { access, refetch: refetchAccess } = useSubscription();
  const [query, setQuery] = useState("");
  /** `undefined` means "use the subject named in the URL"; `null` means no course is open. */
  const [openSubjectId, setOpenSubjectId] = useState<string | null | undefined>(undefined);
  const [showRenewal, setShowRenewal] = useState(false);

  const subjects = useMemo(() => curriculum.data ?? [], [curriculum.data]);
  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          !needle ||
          subject.name.toLowerCase().includes(needle) ||
          subject.terms.some((term) =>
            term.weeks.some((week) => week.lessons.some((lesson) => lesson.title.toLowerCase().includes(needle))),
          ),
      ),
    [subjects, needle],
  );

  const activeSubjectId = openSubjectId === undefined ? requestedSubject : openSubjectId;
  const activeSubject = subjects.find((item) => item.id === activeSubjectId);

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]">
              <BookOpen className="h-4 w-4" aria-hidden />
              Learning library
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tutorials</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Choose a subject to preview its terms and topics, then start learning.
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" aria-hidden />
            <span className="sr-only">Search subjects and lessons</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a subject or lesson…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </header>

        {access === "expired" && (
          <div className="mt-7">
            <ExpiredNotice onRenew={() => setShowRenewal(true)} />
          </div>
        )}
        {access === "error" && (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50">
            <ErrorState
              compact
              title="We couldn't confirm your subscription"
              message="You can browse the curriculum, but lessons stay locked until your access is confirmed."
              onRetry={() => void refetchAccess()}
            />
          </div>
        )}

        <section aria-label="Curriculum" className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {curriculum.isPending ? (
            <LoadingRows label="Loading curriculum" rows={4} />
          ) : curriculum.isError ? (
            <ErrorState
              title="Curriculum unavailable"
              message={curriculum.error instanceof Error ? curriculum.error.message : "We could not load your curriculum."}
              onRetry={() => void curriculum.refetch()}
            />
          ) : subjects.length === 0 ? (
            <EmptyPanel icon={BookOpen} title="Your library is on its way" message="Subjects for your class will appear here as soon as they are published." />
          ) : visible.length === 0 ? (
            <EmptyPanel
              icon={Search}
              title="No matching subjects"
              message="Try a different subject or lesson name."
              action={
                <button type="button" onClick={() => setQuery("")} className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-color)] underline">
                  Clear search
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((subject) => {
                const lessons = countLessons(subject);
                return (
                  <li key={subject.id}>
                    <button
                      type="button"
                      onClick={() => setOpenSubjectId(subject.id)}
                      aria-haspopup="dialog"
                      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--primary-color)] sm:px-6 sm:py-5"
                    >
                      <SubjectImage src={subject.imageUrl} className="h-14 w-20 rounded-xl sm:h-16 sm:w-24" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{subject.name}</span>
                        {subject.description && (
                          <span className="mt-1 line-clamp-2 block text-xs font-normal leading-5 text-slate-600">
                            {subject.description}
                          </span>
                        )}
                        <span className="mt-1 block text-xs font-normal text-slate-600">
                          {subject.terms.length} term{subject.terms.length === 1 ? "" : "s"} · {lessons} lesson
                          {lessons === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="hidden items-center gap-2 text-xs font-semibold text-[var(--primary-color)] sm:inline-flex">
                        View course
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 sm:hidden" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      <CourseModal
        key={activeSubject?.id ?? "closed"}
        subject={activeSubject}
        access={access}
        onClose={() => setOpenSubjectId(null)}
        onUnlock={() => setShowRenewal(true)}
      />
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
    </PortalWrapper>
  );
}
