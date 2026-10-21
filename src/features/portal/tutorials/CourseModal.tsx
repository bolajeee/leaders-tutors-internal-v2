"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDown, Clock3, LockKeyhole, PlayCircle } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import SubjectImage from "@/components/ui/SubjectImage";
import { countLessons } from "@/services/curriculum";
import { canOpenLesson, type AccessStatus } from "@/services/access";
import { useTermWeeks } from "@/hooks/usePortalData";
import { ErrorState } from "@/components/ui/State";
import type { AcademicTerm, CurriculumSubject, Lesson } from "@/types/curriculum";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;
const termLessons = (term: AcademicTerm) =>
  term.lessonCount ?? term.weeks.reduce((sum, week) => sum + week.lessons.length, 0);

function LessonRow({ lesson, access, onUnlock }: { lesson: Lesson; access: AccessStatus; onUnlock: () => void }) {
  const button =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700">
        <PlayCircle className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h5 className="text-sm font-semibold text-slate-900">{lesson.title}</h5>
        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{lesson.summary}</p>
      </div>
      {lesson.duration && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Duration </span>
          {lesson.duration}
        </span>
      )}
      {canOpenLesson(access) ? (
        <Link href={`/tutorials/${lesson.id}`} className={`${button} bg-[var(--primary-color)] text-white`}>
          <PlayCircle className="h-4 w-4" aria-hidden />
          Start lesson
          <span className="sr-only">: {lesson.title}</span>
        </Link>
      ) : access === "expired" ? (
        <button type="button" onClick={onUnlock} className={`${button} bg-orange-100 text-orange-900`}>
          <LockKeyhole className="h-4 w-4" aria-hidden />
          Unlock <span className="sr-only">{lesson.title} by renewing</span>
        </button>
      ) : (
        <span className={`${button} bg-slate-100 text-slate-600`}>
          <LockKeyhole className="h-4 w-4" aria-hidden />
          {access === "loading" ? "Checking access…" : "Access unavailable"}
        </span>
      )}
    </li>
  );
}

/** One term: its header previews what is inside; the dropdown lists the topics, week by week. */
function TermCard({
  subjectId,
  term,
  open,
  onToggle,
  access,
  onUnlock,
}: {
  subjectId: string;
  term: AcademicTerm;
  open: boolean;
  onToggle: () => void;
  access: AccessStatus;
  onUnlock: () => void;
}) {
  const panelId = useId();
  const loadedWeeks = useTermWeeks(subjectId, term, open);
  const weeks = term.weeks.length ? term.weeks : (loadedWeeks.data ?? []);
  const lessons = termLessons(term);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h3 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--primary-color)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{term.label}</span>
            <span className="mt-0.5 block text-xs text-slate-600">
              {lessons === 0
                ? "Topics coming soon"
                : weeks.length
                  ? `${plural(weeks.length, "week")} · ${plural(lessons, "topic")}`
                  : plural(lessons, "topic")}
            </span>
          </span>
          <span className="hidden text-xs font-semibold text-[var(--primary-color)] sm:block">
            {open ? "Hide topics" : "Show topics"}
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h3>
      <div id={panelId} hidden={!open}>
        {open && (
          <div className="space-y-5 border-t border-slate-100 bg-slate-50 p-4">
            {loadedWeeks.isPending && loadedWeeks.fetchStatus === "fetching" ? (
              <div role="status" className="space-y-2">
                <div className="skeleton h-16 rounded-xl" />
                <div className="skeleton h-16 rounded-xl" />
                <span className="sr-only">Loading topics</span>
              </div>
            ) : loadedWeeks.isError ? (
              <ErrorState
                title="Topics couldn't be loaded"
                message={loadedWeeks.error instanceof Error ? loadedWeeks.error.message : "Please try again."}
                onRetry={() => void loadedWeeks.refetch()}
              />
            ) : weeks.length ? (
              weeks.map((week) => (
                <section key={week.id} aria-label={week.label}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">{week.label}</h4>
                  {week.lessons.length ? (
                    <ul className="space-y-2">
                      {week.lessons.map((lesson) => (
                        <LessonRow key={lesson.id} lesson={lesson} access={access} onUnlock={onUnlock} />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg bg-white p-4 text-sm text-slate-600">Lessons for this week are coming soon.</p>
                  )}
                </section>
              ))
            ) : (
              <p className="text-sm text-slate-600">Weeks for this term are coming soon.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Course preview: image, summary and its terms. Mounted per subject, so term state resets on reopen. */
export default function CourseModal({
  subject,
  access,
  onClose,
  onUnlock,
}: {
  subject: CurriculumSubject | undefined;
  access: AccessStatus;
  onClose: () => void;
  onUnlock: () => void;
}) {
  /** `undefined` means "use the default (first term)"; `null` means the user closed them all. */
  const [termId, setTermId] = useState<string | null | undefined>(undefined);
  if (!subject) return null;

  const activeTermId = termId === undefined ? (subject.terms[0]?.id ?? null) : termId;
  const lessons = countLessons(subject);

  return (
    <ModalShell isOpen title={subject.name} onClose={onClose} closeLabel="Close course" maxWidth="max-w-3xl">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <SubjectImage src={subject.imageUrl} className="h-40 w-full rounded-2xl sm:h-32 sm:w-52" />
          <div className="min-w-0">
            {subject.description && <p className="text-sm leading-6 text-slate-700">{subject.description}</p>}
            <p className="mt-3 text-xs font-semibold text-slate-600">
              {plural(subject.terms.length, "term")} · {plural(lessons, "topic")}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {subject.terms.length ? (
            subject.terms.map((term) => (
              <TermCard
                key={term.id}
                subjectId={subject.id}
                term={term}
                open={activeTermId === term.id}
                onToggle={() => setTermId(activeTermId === term.id ? null : term.id)}
                access={access}
                onUnlock={onUnlock}
              />
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">This subject is being prepared. Check back soon.</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
