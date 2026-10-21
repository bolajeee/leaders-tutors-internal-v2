"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Menu,
  PlayCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  benefits,
  faqs,
  howItWorks,
  learningTracks,
  partners,
  stats,
  testimonials,
} from "@/data/marketing";

const nav = [
  ["How it works", "#how-it-works"],
  ["Classes", "#classes"],
  ["Why Leaders Tutors", "#about"],
  ["FAQ", "#faq"],
  ["Contact", "#contact"],
] as const;

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#292b72]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="rounded-xl bg-white px-3 py-2" aria-label="Leaders Tutors home">
            <Image src="/body-pix/logo.png" alt="Leaders Tutors" width={154} height={54} className="h-10 w-auto" priority />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-white/75 transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Log in</Link>
            <Link href="/sign-up" className="rounded-xl bg-[#f39a2e] px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">Start learning</Link>
          </div>
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 lg:hidden" aria-expanded={mobileOpen} aria-label="Toggle navigation">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t border-white/10 px-5 py-5 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/80 hover:bg-white/10">{label}</a>)}
              <div className="mt-3 grid grid-cols-2 gap-3"><Link href="/login" className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold">Log in</Link><Link href="/sign-up" className="rounded-xl bg-[#f39a2e] px-4 py-3 text-center text-sm font-semibold text-slate-950">Start learning</Link></div>
            </div>
          </nav>
        )}
      </header>

      <section className="relative isolate bg-[#292b72] px-5 pb-20 pt-36 text-white sm:pt-44 lg:px-8 lg:pb-28">
        <div className="absolute inset-0 -z-10 overflow-hidden"><div className="absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-[#f39a2e]/20 blur-3xl"/><div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"/></div>
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-orange-200"><Sparkles className="h-4 w-4"/>Learning that moves with you</div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-.04em] sm:text-6xl lg:text-7xl">A stronger education starts with the <span className="text-[#f39a2e]">right guidance.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-indigo-100">Curriculum-based video lessons, helpful notes, and guided practice for Nigerian students—from the first foundation to final-year preparation.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/sign-up" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#f39a2e] px-6 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">Create student account <ArrowRight className="h-5 w-5"/></Link><a href="#classes" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white hover:bg-white/10"><PlayCircle className="h-5 w-5"/>Explore classes</a></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur"><div className="rounded-[1.5rem] bg-white p-6 text-slate-900 sm:p-8"><div className="flex items-center justify-between"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-[#3e4095]">This week</span><GraduationCap className="text-[#f39a2e]"/></div><h2 className="mt-7 text-2xl font-bold">Your learning, clearly organised.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Move naturally from a subject to the right term, week, and lesson.</p><div className="mt-7 space-y-3">{["Basic Science · First Term","Mathematics · Second Term","English Studies · Third Term"].map((item,index)=><div key={item} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"><span className={`grid h-10 w-10 place-items-center rounded-xl ${index===0?"bg-[#3e4095] text-white":"bg-white text-[#3e4095]"}`}><BookOpenCheck className="h-5 w-5"/></span><div className="flex-1"><p className="text-sm font-semibold">{item}</p><p className="mt-1 text-xs text-slate-500">Video, notes and practice</p></div><ArrowRight className="h-4 w-4 text-slate-400"/></div>)}</div></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white px-5 py-9 lg:px-8"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">{stats.map((stat)=><div key={stat.label}><p className="text-2xl font-bold text-[#3e4095] sm:text-3xl">{stat.value}</p><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{stat.label}</p></div>)}</div></section>

      <section id="classes" className="scroll-mt-20 bg-[#f7f7fb] px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f08224]">Learning for every stage</p><h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Built around the learner you are becoming.</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{learningTracks.map((track,index)=><article key={track.level} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="text-xs font-bold uppercase tracking-widest text-[#f08224]">{track.level}</span><div className="my-7 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-[#3e4095]"><span className="text-xl font-bold">0{index+1}</span></div><h3 className="text-xl font-bold">{track.title}</h3><p className="mt-3 leading-7 text-slate-500">{track.copy}</p><Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#3e4095]">Find your class <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link></article>)}</div></div></section>

      <section id="how-it-works" className="scroll-mt-20 px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f08224]">How it works</p><h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">From sign-up to study time.</h2><p className="mt-5 leading-7 text-slate-500">A simple path into consistent, structured learning—with secure access and no clutter.</p></div><ol className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2">{howItWorks.map((item)=><li key={item.step} className="bg-white p-7"><span className="text-sm font-bold text-[#f08224]">{item.step}</span><h3 className="mt-8 text-lg font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{item.copy}</p></li>)}</ol></div></div></section>

      <section id="about" className="scroll-mt-20 bg-[#292b72] px-5 py-24 text-white lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Why Leaders Tutors</p><h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">The freedom to learn from anywhere.</h2><p className="mt-6 max-w-xl leading-8 text-indigo-100">Flexible online classes bring trusted teaching closer to students, making it easier to revisit a difficult idea, prepare for school, and keep learning at a personal pace.</p></div><div className="grid gap-3 sm:grid-cols-2">{benefits.map((benefit)=><div key={benefit} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f39a2e]"/><span className="text-sm font-semibold">{benefit}</span></div>)}</div></div></section>

      <section className="bg-[#f7f7fb] px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f08224]">Student and parent voices</p><h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Learning that fits real life.</h2><div className="mt-12 grid gap-5 lg:grid-cols-3">{testimonials.map((item)=><figure key={item.name} className="rounded-3xl border border-slate-200 bg-white p-7"><blockquote className="text-lg leading-8 text-slate-700">“{item.quote}”</blockquote><figcaption className="mt-8 border-t border-slate-100 pt-5"><p className="font-bold">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.role}</p></figcaption></figure>)}</div></div></section>

      <section className="px-5 py-16 lg:px-8"><div className="mx-auto max-w-7xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-slate-400">Learning with our partners</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{partners.map((partner)=><div key={partner} className="rounded-2xl border border-slate-200 px-5 py-5 text-sm font-bold text-slate-500">{partner}</div>)}</div></div></section>

      <section id="faq" className="scroll-mt-20 bg-[#f7f7fb] px-5 py-24 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f08224]">Frequently asked</p><h2 className="mt-4 text-4xl font-bold tracking-tight">Everything you need to begin.</h2></div><div className="divide-y divide-slate-200 border-y border-slate-200">{faqs.map((faq,index)=><div key={faq.question}><button type="button" onClick={()=>setOpenFaq(openFaq===index?-1:index)} className="flex w-full items-center justify-between gap-4 py-6 text-left font-semibold" aria-expanded={openFaq===index}>{faq.question}<ChevronDown className={`h-5 w-5 shrink-0 transition ${openFaq===index?"rotate-180":""}`}/></button>{openFaq===index&&<p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-slate-500">{faq.answer}</p>}</div>)}</div></div></section>

      <section id="contact" className="scroll-mt-20 px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#f39a2e] p-8 sm:p-12 lg:flex lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-slate-800/65">Ready when you are</p><h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950">Make the next lesson count.</h2><p className="mt-4 max-w-xl leading-7 text-slate-800">Create a student account and bring structured, flexible learning into every week.</p></div><Link href="/sign-up" className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#292b72] px-6 py-3.5 font-semibold text-white lg:mt-0">Start learning <ArrowRight className="h-5 w-5"/></Link></div></section>

      <footer className="bg-slate-950 px-5 py-14 text-slate-300 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3"><div><Image src="/body-pix/logo.png" alt="Leaders Tutors" width={154} height={54} className="h-11 w-auto rounded-lg bg-white px-2"/><p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">Education meets innovation through accessible video learning for students across Nigeria.</p></div><div><h3 className="font-semibold text-white">Contact</h3><address className="mt-4 space-y-2 text-sm not-italic text-slate-400"><p>Suite 213, Block A, 2–4 Sura Shopping Complex, Lagos Island</p><p>+234 708 701 3213</p><p>Info@leaderstutors.com</p></address></div><div><h3 className="font-semibold text-white">Student access</h3><div className="mt-4 flex gap-3"><Link href="/login" className="text-sm text-slate-400 hover:text-white">Log in</Link><span className="text-slate-700">·</span><Link href="/sign-up" className="text-sm text-slate-400 hover:text-white">Create account</Link></div></div></div><div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-slate-500">© 2023–2026 Leaders Tutors. All rights reserved.</div></footer>
    </main>
  );
}
