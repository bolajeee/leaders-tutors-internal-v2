"use client";

import { useState } from "react";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import { SubjectWithVideos } from "@/types/portal";

interface SubjectListProps {
  subjects: SubjectWithVideos[];
  isLoading: boolean;
  onViewContent: (subject: SubjectWithVideos) => void;
  emptyMessage?: string;
  searchable?: boolean;
}

export default function SubjectList({
  subjects,
  isLoading,
  onViewContent,
  emptyMessage = "Your tutorial subjects will appear here when they are available.",
  searchable = false,
}: SubjectListProps) {
  const [query, setQuery] = useState("");
  const visible = subjects.filter((subject) =>
    subject.subjectName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (isLoading)
    return (
      <div
        className="divide-y divide-slate-100 px-5 sm:px-6"
        role="status"
        aria-label="Loading subjects"
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-4 py-5 motion-safe:animate-pulse"
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
            <div className="h-10 w-20 rounded-lg bg-slate-100" />
          </div>
        ))}
        <span className="sr-only">Loading subjects...</span>
      </div>
    );

  return (
    <div>
      {searchable && subjects.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <span className="sr-only">Search subjects</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a subject..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-color-light)]"
            />
          </label>
          <p className="text-xs text-slate-500" role="status">
            {visible.length} of {subjects.length} subjects
          </p>
        </div>
      )}
      {!visible.length ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-slate-400">
            {query ? (
              <Search className="h-7 w-7" />
            ) : (
              <BookOpen className="h-7 w-7" />
            )}
          </div>
          <h3 className="mb-2 font-semibold text-slate-900">
            {query ? "No matching subjects" : "Your library is on its way"}
          </h3>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            {query
              ? "Try a different subject name to find your course."
              : emptyMessage}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-color)] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((subject) => {
            const totalVideos = subject.yearGroups.reduce(
              (total, group) => total + group.videos.length,
              0,
            );
            const yearCount = subject.yearGroups.length;
            return (
              <li
                key={subject.subjectId}
                className="flex items-center justify-between gap-3 px-5 py-5 transition hover:bg-slate-50/70 sm:gap-5 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[var(--primary-color)] sm:flex">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold leading-6 text-slate-900">
                      {subject.subjectName}
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {yearCount} year{yearCount !== 1 ? "s" : ""} ·{" "}
                      {totalVideos} lesson{totalVideos !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onViewContent(subject)}
                  aria-label={`View course content for ${subject.subjectName}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-[var(--primary-color)] transition hover:bg-[var(--primary-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)] sm:px-4 sm:text-sm"
                >
                  <span className="sm:hidden">View</span>
                  <span className="hidden sm:inline">View course content</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
