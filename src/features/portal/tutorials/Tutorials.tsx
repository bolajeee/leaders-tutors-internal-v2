"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, ChevronDown, Clock3, LockKeyhole, PlayCircle, RefreshCw, Search } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { fetchDashboardSummary } from "@/services/portal";
import { getCurriculumRepository, isMockCurriculum } from "@/services/curriculum";
import type { CurriculumSubject } from "@/types/curriculum";

export default function Tutorials() {
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [query, setQuery] = useState("");
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(isMockCurriculum());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubscription, setShowSubscription] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [catalog, summary] = await Promise.all([
        getCurriculumRepository().getSubjects(),
        fetchDashboardSummary().catch(() => null),
      ]);
      setSubjects(catalog);
      setIsActive(isMockCurriculum() || summary?.subscriptionStatus === "active");
      setOpenSubject(catalog[0]?.id ?? null);
      setOpenTerm(catalog[0]?.terms[0]?.id ?? null);
      setOpenWeek(catalog[0]?.terms[0]?.weeks[0]?.id ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We could not load your curriculum.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => subjects.filter((subject) =>
    subject.name.toLowerCase().includes(query.trim().toLowerCase())), [subjects, query]);

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]"><BookOpen className="h-4 w-4"/>Learning library</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tutorials</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose a subject, term, and week to continue your curriculum.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"/><span className="sr-only">Search subjects</span><input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Find a subject..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-indigo-100"/></label>
        </header>

        {!isActive && !isLoading && (
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-orange-600"/><div><p className="font-semibold text-slate-900">Your lesson access has expired</p><p className="mt-1 text-sm leading-6 text-slate-600">You can browse the curriculum and renew before opening a lesson.</p></div></div><button type="button" onClick={()=>setShowSubscription(true)} className="min-h-11 rounded-xl bg-[#f39a2e] px-5 text-sm font-semibold text-slate-950">Renew access</button></div>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="space-y-4 p-6" role="status">{[1,2,3,4].map((item)=><div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100"/>)}<span className="sr-only">Loading curriculum</span></div>
          ) : error ? (
            <div className="grid place-items-center px-6 py-16 text-center"><AlertCircle className="h-9 w-9 text-red-500"/><h2 className="mt-4 font-semibold text-slate-900">Curriculum unavailable</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p><button type="button" onClick={()=>void load()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 py-3 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4"/>Try again</button></div>
          ) : visible.length === 0 ? (
            <div className="grid place-items-center px-6 py-16 text-center"><Search className="h-8 w-8 text-slate-300"/><h2 className="mt-4 font-semibold">No matching subjects</h2><p className="mt-2 text-sm text-slate-500">Try a different subject name.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((subject) => {
                const subjectOpen = openSubject === subject.id;
                const lessonCount = subject.terms.flatMap((term)=>term.weeks).flatMap((week)=>week.lessons).length;
                return <article key={subject.id}>
                  <button type="button" onClick={()=>setOpenSubject(subjectOpen?null:subject.id)} className="flex w-full items-center gap-4 px-5 py-5 text-left hover:bg-slate-50 sm:px-6" aria-expanded={subjectOpen}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-[var(--primary-color)]"><BookOpen className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="block font-semibold text-slate-900">{subject.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{subject.description}</span></span><span className="hidden text-xs text-slate-400 sm:block">{lessonCount} lesson{lessonCount===1?"":"s"}</span><ChevronDown className={`h-5 w-5 text-slate-400 transition ${subjectOpen?"rotate-180":""}`}/></button>
                  {subjectOpen && <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">{subject.terms.length ? <div className="space-y-3">{subject.terms.map((term)=>{const termOpen=openTerm===term.id; return <div key={term.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><button type="button" onClick={()=>setOpenTerm(termOpen?null:term.id)} className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-slate-800" aria-expanded={termOpen}><span>{term.label}</span><span className="flex items-center gap-3 text-xs font-normal text-slate-400">{term.weeks.length} weeks <ChevronDown className={`h-4 w-4 transition ${termOpen?"rotate-180":""}`}/></span></button>{termOpen&&<div className="divide-y divide-slate-100 border-t border-slate-100">{term.weeks.length?term.weeks.map((week)=>{const weekOpen=openWeek===week.id; return <div key={week.id}><button type="button" onClick={()=>setOpenWeek(weekOpen?null:week.id)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700" aria-expanded={weekOpen}><span>{week.label}</span><ChevronDown className={`h-4 w-4 transition ${weekOpen?"rotate-180":""}`}/></button>{weekOpen&&<div className="space-y-2 bg-slate-50 p-3">{week.lessons.length?week.lessons.map((lesson)=><div key={lesson.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><PlayCircle className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-900">{lesson.title}</h3><p className="mt-1 line-clamp-1 text-xs text-slate-500">{lesson.summary}</p></div><span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5"/>{lesson.duration}</span>{isActive?<Link href={`/tutorials/${lesson.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary-color)] px-4 text-xs font-semibold text-white"><PlayCircle className="h-4 w-4"/>Start lesson</Link>:<button type="button" onClick={()=>setShowSubscription(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-orange-100 px-4 text-xs font-semibold text-orange-800"><LockKeyhole className="h-4 w-4"/>Unlock</button>}</div>):<p className="rounded-lg bg-white p-4 text-sm text-slate-500">Lessons for this week are coming soon.</p>}</div>}</div>}):<p className="p-4 text-sm text-slate-500">Weeks for this term are coming soon.</p>}</div>}</div>})}</div>:<p className="p-4 text-sm text-slate-500">This subject is being prepared.</p>}</div>}
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
      <SubscriptionModal isOpen={showSubscription} onClose={()=>setShowSubscription(false)} onSuccess={()=>{setIsActive(true);setShowSubscription(false);}} />
    </PortalWrapper>
  );
}
