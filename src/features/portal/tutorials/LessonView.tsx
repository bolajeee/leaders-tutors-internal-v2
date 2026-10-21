"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Download, FileQuestion, LockKeyhole, PlayCircle } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { getCurriculumRepository, isMockCurriculum } from "@/services/curriculum";
import { fetchDashboardSummary } from "@/services/portal";
import type { Lesson } from "@/types/curriculum";

export default function LessonView({ lessonId }: { lessonId: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(isMockCurriculum());

  useEffect(() => {
    void Promise.all([getCurriculumRepository().getLesson(lessonId), fetchDashboardSummary().catch(()=>null)])
      .then(([item, summary])=>{setLesson(item);setIsActive(isMockCurriculum()||summary?.subscriptionStatus==="active");})
      .finally(()=>setIsLoading(false));
  }, [lessonId]);

  return <PortalWrapper><div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
    <Link href="/tutorials" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--primary-color)] hover:bg-indigo-50"><ArrowLeft className="h-4 w-4"/>Back to tutorials</Link>
    {isLoading ? <div className="mt-6 space-y-4"><div className="aspect-video animate-pulse rounded-2xl bg-slate-200"/><div className="h-24 animate-pulse rounded-2xl bg-slate-100"/></div> : !lesson ? <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center"><BookOpen className="mx-auto h-9 w-9 text-slate-300"/><h1 className="mt-4 text-xl font-semibold">Lesson not found</h1><p className="mt-2 text-sm text-slate-500">This lesson may have moved or is not available yet.</p></div> : !isActive ? <div className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-10 text-center"><LockKeyhole className="mx-auto h-10 w-10 text-orange-600"/><h1 className="mt-4 text-2xl font-semibold">Renew to open this lesson</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">Your curriculum remains visible, but lesson video and materials require an active subscription.</p><Link href="/subscriptions" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#f39a2e] px-5 text-sm font-semibold text-slate-950">Manage subscription</Link></div> : <>
      <header className="mt-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#f08224]">{lesson.subjectId.replaceAll("-"," ")} · {lesson.duration}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{lesson.title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{lesson.summary}</p></header>
      <div className="mt-7 overflow-hidden rounded-2xl bg-slate-950 shadow-xl">{lesson.videoUrl?<video controls preload="metadata" className="aspect-video w-full" poster={lesson.thumbnailUrl}><source src={lesson.videoUrl}/><track kind="captions"/></video>:<div className="grid aspect-video place-items-center text-center text-white"><div><PlayCircle className="mx-auto h-12 w-12"/><p className="mt-3">Video is not available for this lesson.</p></div></div>}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">About this lesson</h2><p className="mt-3 text-sm leading-7 text-slate-600">{lesson.summary}</p><div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500"><Clock3 className="h-4 w-4"/>{lesson.duration}<CheckCircle2 className="ml-3 h-4 w-4 text-emerald-500"/>Curriculum aligned</div></section><aside className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Lesson resources</h2><div className="mt-4 space-y-2">{lesson.materials.length?lesson.materials.map((material)=><a key={material.id} href={material.url} download className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-[var(--primary-color)]"><Download className="h-4 w-4"/>{material.title}</a>):<p className="text-sm text-slate-500">No materials attached.</p>}</div></div>{lesson.assessment&&<a href={lesson.assessment.url} className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#f39a2e] px-5 font-semibold text-slate-950"><FileQuestion className="h-5 w-5"/><span>{lesson.assessment.label}<span className="block text-xs font-normal opacity-70">{lesson.assessment.questionCount ?? 0} practice questions</span></span></a>}</aside></div>
    </>}
  </div></PortalWrapper>;
}
