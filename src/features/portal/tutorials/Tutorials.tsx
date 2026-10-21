"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Clock3,
  LockKeyhole,
  PlayCircle,
  Search,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { EmptyPanel, ErrorState, ExpiredNotice, LoadingRows } from "@/components/ui/State";
import { useCurriculum, useSubscription } from "@/hooks/usePortalData";
import { countLessons } from "@/services/curriculum";
import { canOpenLesson, type AccessStatus } from "@/services/access";
import type { AcademicTerm, CurriculumSubject, CurriculumWeek, Lesson } from "@/types/curriculum";

/** `undefined` means "use the default"; `null` means the user closed everything. */
type OpenId = string | null | undefined;

function Disclosure({
  label,
  meta,
  open,
  onToggle,
  level,
  icon,
  description,
  children,
}: {
  label: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  level: "subject" | "term" | "week";
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  const panelId = useId();
  const styles = {
    subject: "px-5 py-5 sm:px-6 hover:bg-slate-50",
    term: "px-4 py-4 text-sm font-semibold text-slate-900",
    week: "px-4 py-3 text-sm text-slate-800",
  }[level];
  const Heading = { subject: "h2", term: "h3", week: "h4" }[level] as "h2" | "h3" | "h4";

  return (
    <div>
      <Heading className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`flex w-full items-center gap-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--primary-color)] ${styles}`}
        >
          {icon}
          <span className="min-w-0 flex-1">
            <span className={`block ${level === "subject" ? "font-semibold text-slate-900" : ""}`}>{label}</span>
            {description && <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{description}</span>}
          </span>
          {meta && <span className="hidden text-xs font-normal text-slate-600 sm:block">{meta}</span>}
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </Heading>
      <div id={panelId} hidden={!open}>
        {open && children}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  access,
  onUnlock,
}: {
  lesson: Lesson;
  access: AccessStatus;
  onUnlock: () => void;
}) {
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
      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
        <Clock3 className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Duration </span>
        {lesson.duration}
      </span>
      {canOpenLesson(access) ? (
        <Link href={`/tutorials/${lesson.id}`} className={`${button} bg-[var(--primary-color)] text-white`}>
          <PlayCircle className="h-4 w-4" aria-hidden />
          Start lesson
          <span className="sr-only">: {lesson.title}</span>
        </Link>
      ) : access === "expired" ? (
        <button type="button" onClick={onUnlock} className={`${button} bg-orange-100 text-orange-900`}>
          <LockKeyhole className="h-4 w-4" aria-hidden />
          Unlock
          {" "}
          <span className="sr-only">{lesson.title} by renewing</span>
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

function WeekPanel({
  week,
  open,
  onToggle,
  access,
  onUnlock,
}: {
  week: CurriculumWeek;
  open: boolean;
  onToggle: () => void;
  access: AccessStatus;
  onUnlock: () => void;
}) {
  return (
    <Disclosure
      level="week"
      label={week.label}
      meta={`${week.lessons.length} lesson${week.lessons.length === 1 ? "" : "s"}`}
      open={open}
      onToggle={onToggle}
    >
      <div className="bg-slate-50 p-3">
        {week.lessons.length ? (
          <ul className="space-y-2">
            {week.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} access={access} onUnlock={onUnlock} />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-600">Lessons for this week are coming soon.</p>
        )}
      </div>
    </Disclosure>
  );
}

function TermPanel({
  term,
  open,
  onToggle,
  openWeek,
  onToggleWeek,
  access,
  onUnlock,
}: {
  term: AcademicTerm;
  open: boolean;
  onToggle: () => void;
  openWeek: string | null;
  onToggleWeek: (id: string) => void;
  access: AccessStatus;
  onUnlock: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Disclosure
        level="term"
        label={term.label}
        meta={`${term.weeks.length} week${term.weeks.length === 1 ? "" : "s"}`}
        open={open}
        onToggle={onToggle}
      >
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {term.weeks.length ? (
            term.weeks.map((week) => (
              <WeekPanel
                key={week.id}
                week={week}
                open={openWeek === week.id}
                onToggle={() => onToggleWeek(week.id)}
                access={access}
                onUnlock={onUnlock}
              />
            ))
          ) : (
            <p className="p-4 text-sm text-slate-600">Weeks for this term are coming soon.</p>
          )}
        </div>
      </Disclosure>
    </div>
  );
}

export default function Tutorials() {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject");
  const curriculum = useCurriculum();
  const { access, refetch: refetchAccess } = useSubscription();
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<OpenId>(undefined);
  const [termId, setTermId] = useState<OpenId>(undefined);
  const [weekId, setWeekId] = useState<OpenId>(undefined);
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

  const defaultSubject = subjects.find((item) => item.id === requestedSubject)?.id ?? subjects[0]?.id ?? null;
  const activeSubjectId = subjectId === undefined ? defaultSubject : subjectId;
  const activeSubject: CurriculumSubject | undefined = subjects.find((item) => item.id === activeSubjectId);
  const activeTermId = termId === undefined ? (activeSubject?.terms[0]?.id ?? null) : termId;
  const activeTerm = activeSubject?.terms.find((item) => item.id === activeTermId);
  const activeWeekId = weekId === undefined ? (activeTerm?.weeks[0]?.id ?? null) : weekId;

  const toggleSubject = (id: string) => {
    setSubjectId(activeSubjectId === id ? null : id);
    setTermId(undefined);
    setWeekId(undefined);
  };
  const toggleTerm = (id: string) => {
    setTermId(activeTermId === id ? null : id);
    setWeekId(undefined);
  };
  const toggleWeek = (id: string) => setWeekId(activeWeekId === id ? null : id);

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
              Choose a subject, then a term and week, to continue your curriculum.
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
            <div className="divide-y divide-slate-100">
              {visible.map((subject) => {
                const open = activeSubjectId === subject.id;
                const lessons = countLessons(subject);
                return (
                  <article key={subject.id}>
                    <Disclosure
                      level="subject"
                      label={subject.name}
                      description={subject.description}
                      meta={`${lessons} lesson${lessons === 1 ? "" : "s"}`}
                      open={open}
                      onToggle={() => toggleSubject(subject.id)}
                      icon={
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-[var(--primary-color)]">
                          <BookOpen className="h-5 w-5" aria-hidden />
                        </span>
                      }
                    >
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
                        {subject.terms.length ? (
                          <div className="space-y-3">
                            {subject.terms.map((term) => (
                              <TermPanel
                                key={term.id}
                                term={term}
                                open={activeTermId === term.id}
                                onToggle={() => toggleTerm(term.id)}
                                openWeek={activeTermId === term.id ? activeWeekId : null}
                                onToggleWeek={toggleWeek}
                                access={access}
                                onUnlock={() => setShowRenewal(true)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="p-4 text-sm text-slate-600">This subject is being prepared. Check back soon.</p>
                        )}
                      </div>
                    </Disclosure>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
    </PortalWrapper>
  );
}
