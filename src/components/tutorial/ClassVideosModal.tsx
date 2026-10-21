"use client";

import { useEffect, useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  X,
  BookOpen,
  Search,
  ChevronDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/dialog-box/Modal";
import { SubjectWithVideos } from "@/types/portal";

interface ClassVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectWithVideos | null;
}

export default function ClassVideosModal({
  isOpen,
  onClose,
  subject,
}: ClassVideosModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const yearGroups = subject?.yearGroups ?? [];
  const totalVideos = yearGroups.reduce(
    (total, group) => total + group.videos.length,
    0,
  );
  const firstVideo = yearGroups.flatMap((group) => group.videos)[0];
  const search = query.trim().toLowerCase();
  const visibleGroups = yearGroups
    .filter((group) => !selectedYear || group.yearId === selectedYear)
    .map((group) => ({
      ...group,
      videos:
        !search || group.yearLabel.includes(search)
          ? group.videos
          : group.videos.filter((video) =>
              video.title.toLowerCase().includes(search),
            ),
    }))
    .filter(
      (group) =>
        !search || group.yearLabel.includes(search) || group.videos.length > 0,
    );
  const firstPopulatedYear = visibleGroups.find(
    (group) => group.videos.length,
  )?.yearId;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button, input, summary, [tabindex="0"]',
        ) ?? [],
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.hasAttribute("disabled"),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  const watchVideo = (tutorialId: string) => {
    onClose();
    router.push(
      `/tutorials/watch?tutorialId=${encodeURIComponent(tutorialId)}`,
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy={headingId}>
      <div
        className="flex min-h-full items-center justify-center bg-slate-950/20 p-2 backdrop-blur-sm sm:p-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          aria-labelledby={headingId}
          className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none sm:max-h-[85dvh]"
        >
          <div className="relative shrink-0 border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50/40 p-6 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close course content"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-medium text-[var(--primary-color)]">
              <BookOpen className="h-3.5 w-3.5" />
              Course content
            </div>
            <h2
              id={headingId}
              className="break-words pr-10 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl"
            >
              {subject?.subjectName ?? "Your course"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {totalVideos} lesson{totalVideos !== 1 ? "s" : ""} ·{" "}
              {yearGroups.length} examination year
              {yearGroups.length !== 1 ? "s" : ""}
            </p>
            {firstVideo && (
              <button
                type="button"
                onClick={() => watchVideo(firstVideo.id)}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover-color)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary-color)]"
              >
                <Play className="h-4 w-4" />
                Start learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
          <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-8">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <span className="sr-only">
                Search lessons or examination years
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lessons or a year..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color-light)]"
              />
            </label>
            <div
              className="mt-3 flex gap-2 overflow-x-auto pb-1"
              aria-label="Filter by examination year"
            >
              {[{ yearId: "", yearLabel: "All years" }, ...yearGroups].map(
                (group) => (
                  <button
                    key={group.yearId}
                    type="button"
                    aria-pressed={selectedYear === group.yearId}
                    onClick={() => setSelectedYear(group.yearId)}
                    className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)] ${selectedYear === group.yearId ? "bg-[var(--primary-color)] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  >
                    {group.yearLabel}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 p-5 sm:px-8 sm:py-6">
            {!visibleGroups.length ? (
              <div className="py-10 text-center">
                <Search className="mx-auto mb-3 h-7 w-7 text-slate-400" />
                <h3 className="font-semibold text-slate-800">
                  {search ? "No lessons found" : "Content is on its way"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {search
                    ? "Try another title or examination year."
                    : "Lessons for this course will appear here once available."}
                </p>
                {(search || selectedYear) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSelectedYear("");
                    }}
                    className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-color)] focus-visible:outline-2"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleGroups.map((group) => (
                  <details
                    key={`${group.yearId}-${search}-${selectedYear}`}
                    open={
                      !!search ||
                      !!selectedYear ||
                      group.yearId === firstPopulatedYear
                    }
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-4 text-slate-900 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--primary-color)] [&::-webkit-details-marker]:hidden">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold">
                        {group.yearLabel}
                      </span>
                      <span className="flex-1 text-sm font-semibold">
                        Examination lessons
                      </span>
                      <span className="text-xs text-slate-500">
                        {group.videos.length} lesson
                        {group.videos.length !== 1 ? "s" : ""}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100">
                      {!group.videos.length && (
                        <p className="px-5 py-6 text-sm leading-6 text-slate-500">
                          No videos available for {group.yearLabel} yet. Check
                          back for new lessons.
                        </p>
                      )}
                      {group.videos.map((video, index) => (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => watchVideo(video.id)}
                          aria-label={`Watch ${video.title}`}
                          className="group/lesson flex min-h-20 w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-indigo-50/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--primary-color)] sm:gap-4 sm:px-5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-[var(--primary-color)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {video.thumbnailUrl ? (
                            <span
                              role="img"
                              aria-label={`Thumbnail for ${video.title}`}
                              className="h-12 w-16 shrink-0 rounded-lg bg-slate-100 bg-cover bg-center shadow-sm sm:h-14 sm:w-20"
                              style={{
                                backgroundImage: `url(${JSON.stringify(video.thumbnailUrl)})`,
                              }}
                            />
                          ) : null}
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm font-medium leading-6 text-slate-800">
                              {video.title}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {video.duration || "Video lesson"}
                            </span>
                          </span>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[var(--primary-color)] transition group-hover/lesson:border-[var(--primary-color)] group-hover/lesson:bg-[var(--primary-color)] group-hover/lesson:text-white">
                            <Play className="h-4 w-4" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-8">
            <BookOpen className="h-3.5 w-3.5" />
            Choose an examination year, then select a lesson to watch.
          </div>
        </div>
      </div>
    </Modal>
  );
}
