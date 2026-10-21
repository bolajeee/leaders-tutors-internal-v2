"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import {
  benefits,
  categories,
  classPreviews,
  contact,
  faqs,
  hero,
  howItWorks,
  partners,
  popularIntro,
  stats,
  telHref,
  testimonials,
  type ClassPreview,
} from "@/data/marketing";
import AnimatedBackdrop from "./AnimatedBackdrop";

const eyebrow = "text-xs font-bold uppercase tracking-[.2em]";

export function Hero() {
  const [before, after] = hero.headline.split(hero.highlight);
  return (
    <section className="relative isolate bg-[#292b72] px-5 pb-20 pt-36 text-white sm:pt-44 lg:px-8 lg:pb-28">
      <AnimatedBackdrop />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-orange-200">
            <Sparkles className="h-4 w-4" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-[-.03em] sm:text-6xl lg:text-7xl">
            {before}
            <span className="text-[#f39a2e]">{hero.highlight}</span>
            {after}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-indigo-100">{hero.intro}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={hero.primaryCta.href} className="animate-cta-pulse inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#f39a2e] px-6 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">
              {hero.primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href={hero.secondaryCta.href} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white hover:bg-white/10">
              <PlayCircle className="h-5 w-5" aria-hidden />
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
          <div className="animate-glow-pulse absolute -inset-4 rounded-[2.5rem] bg-linear-to-tr from-[#f39a2e] to-indigo-400 opacity-60 blur-2xl" aria-hidden />
          <div className="relative aspect-4/5 overflow-hidden rounded-4xl border border-white/20 bg-indigo-900 shadow-2xl">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 512px, 90vw"
              className="object-cover object-[50%_18%]"
            />
          </div>
          <div className="animate-float absolute -left-3 bottom-8 flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 text-slate-900 shadow-xl sm:-left-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#3e4095] text-white">
              <BookOpenCheck className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold">Video, notes and practice</span>
              <span className="block text-xs text-slate-600">By subject, term and week</span>
            </span>
          </div>
          <div className="animate-float absolute -right-3 top-8 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-xl [animation-delay:-3s] sm:-right-6">
            <span className="flex items-center gap-2 text-xl font-bold text-[#3e4095]">
              <GraduationCap className="h-5 w-5 text-[#f39a2e]" aria-hidden />
              {stats[3].value}
            </span>
            <span className="block text-xs text-slate-600">{stats[3].label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section aria-labelledby="stats-heading" className="border-b border-slate-100 bg-white px-5 py-12 lg:px-8">
      <h2 id="stats-heading" className="mx-auto mb-8 max-w-7xl text-sm font-semibold text-slate-700">
        Stats that explain everything about <span className="text-[#3e4095]">our success</span>
      </h2>
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dd className="text-2xl font-bold text-[#3e4095] sm:text-3xl">{stat.value}</dd>
            <dt className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

const cardTints = [
  "from-[#3e4095] to-[#5b5fc7]",
  "from-[#d97706] to-[#f39a2e]",
  "from-[#0f766e] to-[#14b8a6]",
  "from-[#7e22ce] to-[#a855f7]",
  "from-[#be123c] to-[#e11d48]",
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function ClassCard({ item, index }: { item: ClassPreview; index: number }) {
  const [saved, setSaved] = useState(false);
  const details = [
    ["Subject", item.subject],
    ["Term", item.term],
    ["Week", item.week],
    ["Duration", item.duration],
  ];
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw" className="object-cover" />
        ) : (
          <div className={`grid h-full place-items-center bg-linear-to-br ${cardTints[index % cardTints.length]}`} aria-hidden>
            <GraduationCap className="h-16 w-16 text-white/85" />
          </div>
        )}
        <span className="absolute left-0 top-3 rounded-r bg-red-700 px-3 py-1 text-[11px] font-bold uppercase text-white">{item.level}</span>
      </div>
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-[#3e4095]" aria-hidden>
          {initials(item.tutor)}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-950">
            <span className="truncate">{item.tutor}</span>
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-label="Verified tutor" />
          </h3>
          <p className="truncate text-xs text-slate-700">ID:{item.tutorId}</p>
        </div>
      </div>
      <dl className="space-y-2.5 px-5 py-5 text-xs">
        {details.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-600">{label}:</dt>
            <dd className="text-right text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex items-stretch border-t border-slate-200 text-xs text-slate-700">
        <span className="flex flex-1 items-center gap-1.5 px-4 py-3.5 uppercase">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {item.views} views
        </span>
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
          aria-label={`Save ${item.level} ${item.subject}`}
          className="grid w-14 place-items-center border-l border-slate-200 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3e4095]"
        >
          <Heart className={`h-5 w-5 transition ${saved ? "fill-red-600 text-red-600" : "text-slate-600"}`} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function PopularClasses({ showAllLink = false }: { showAllLink?: boolean }) {
  const track = useRef<HTMLUListElement>(null);
  const slide = (direction: 1 | -1) => {
    const element = track.current;
    element?.scrollBy?.({ left: direction * element.clientWidth, behavior: "smooth" });
  };
  const arrow =
    "grid h-10 w-10 place-items-center rounded-full bg-slate-200/70 text-[#3e4095] transition hover:bg-[#3e4095] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e4095]";

  return (
    <section aria-labelledby="classes-heading" className="bg-[#f7f7fb] px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <svg viewBox="0 0 56 14" className="mx-auto h-3.5 w-14 text-[#f39a2e]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M3 8Q9.5 -1 16 7T29 7T42 7T53 7" />
          </svg>
          <h2 id="classes-heading" className="mt-5 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">Our Popular Topics And Views</h2>
          <p className="mt-5 leading-7 text-slate-700">{popularIntro}</p>
        </div>
        <ul ref={track} className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2">
          {classPreviews.map((item, index) => (
            <li key={`${item.level}-${item.subject}-${index}`} className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <ClassCard item={item} index={index} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <button type="button" onClick={() => slide(-1)} aria-label="Previous classes" className={arrow}>
              <ChevronsLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => slide(1)} aria-label="Next classes" className={arrow}>
              <ChevronsRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {showAllLink && (
            <Link href="/available-tutorials" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#3e4095] px-6 font-semibold text-white transition hover:bg-[#2c2f7a]">
              Explore all Classes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-slate-800">Browse by category</h3>
          <ul className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <li key={category.name} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                {category.name}
                <span className="rounded-full bg-[#3e4095] px-2 py-0.5 text-xs text-white" aria-label={`${category.count}`}>{category.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-5 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className={`${eyebrow} text-amber-800`}>How it works</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">From sign-up to study time.</h2>
          <p className="mt-5 leading-7 text-slate-600">A simple path into consistent, structured learning, with secure access and no clutter.</p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          {howItWorks.map((item) => (
            <li key={item.step} className="bg-white p-7">
              <span className="text-sm font-bold text-amber-800">{item.step}</span>
              <h3 className="mt-8 text-lg font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Benefits() {
  return (
    <section id="about" className="scroll-mt-20 bg-[#292b72] px-5 py-24 text-white lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className={`${eyebrow} text-orange-300`}>Why Leaders Tutors</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">The freedom to learn from anywhere.</h2>
          <p className="mt-6 max-w-xl leading-8 text-indigo-100">
            Flexible online classes bring trusted teaching closer to students, making it easier to revisit a difficult idea, prepare for school and keep learning at a personal pace.
          </p>
        </div>
        <ul className="grid gap-3">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f39a2e]" aria-hidden />
              <span>
                <span className="block text-sm font-semibold">{benefit.title}</span>
                <span className="mt-1 block text-sm leading-6 text-indigo-100">{benefit.copy}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="bg-[#f7f7fb] px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className={`${eyebrow} text-amber-800`}>Student and parent voices</p>
        <h2 id="testimonials-heading" className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">Learning that fits real life.</h2>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item) => (
            <li key={item.name}>
              <figure className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7">
                <blockquote className="leading-7 text-slate-800">“{item.quote}”</blockquote>
                <figcaption className="mt-8 border-t border-slate-100 pt-5">
                  <p className="font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.role}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Partners() {
  return (
    <section id="partners" className="scroll-mt-20 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-xs font-bold uppercase tracking-[.2em] text-slate-600">Learning with our partners</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {partners.map((partner) => (
            <li key={partner} className="rounded-2xl border border-slate-200 px-5 py-5 text-sm font-bold text-slate-700">
              {partner}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FaqItem({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 py-6 text-left font-semibold"
          aria-expanded={open}
          aria-controls={panelId}
        >
          {question}
          <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h3>
      <div id={panelId} hidden={!open}>
        <p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-slate-600">{answer}</p>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-[#f7f7fb] px-5 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className={`${eyebrow} text-amber-800`}>Frequently asked</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to begin.</h2>
        </div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq, index) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} defaultOpen={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !form.message.trim()) {
      setError("Please enter your name, a valid email address and a message.");
      return;
    }
    setError("");
    const subject = encodeURIComponent(`Message from ${form.name.trim()} via leaderstutors.com`);
    const body = encodeURIComponent(`${form.message.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`);
    setStarted(true);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  };

  const field =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#3e4095] focus:ring-2 focus:ring-indigo-100";

  return (
    <section id="contact" className="scroll-mt-20 px-5 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className={`${eyebrow} text-amber-800`}>Contact us</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Make the next lesson count.</h2>
          <p className="mt-4 max-w-xl leading-7 text-slate-600">Questions about classes, payments or your account? Reach the team directly.</p>
          <address className="mt-8 space-y-4 not-italic">
            <p className="flex items-start gap-3 text-sm text-slate-800">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#3e4095]" aria-hidden />
              {contact.address}
            </p>
            <p className="flex items-start gap-3 text-sm text-slate-800">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#3e4095]" aria-hidden />
              <span>
                <a className="font-semibold underline" href={telHref(contact.phone)}>{contact.phone}</a>
                <span className="block text-slate-600">
                  Customer care: <a className="underline" href={telHref(contact.customerCare)}>{contact.customerCare}</a>
                </span>
              </span>
            </p>
            <p className="flex items-start gap-3 text-sm text-slate-800">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#3e4095]" aria-hidden />
              <a className="font-semibold underline" href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          </address>
        </div>
        <form onSubmit={submit} noValidate className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold">Send us a message</h3>
          <p className="mt-1 text-sm text-slate-600">This opens your email app with your message ready to send.</p>
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}
          {started && !error && (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Your email app should now be open. If it isn&apos;t, write to {contact.email}.</p>
          )}
          <label className="mt-5 block text-sm font-medium text-slate-800">
            Your name
            <input className={field} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-800">
            Email address
            <input className={field} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-800">
            Message
            <textarea className={`${field} min-h-32`} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </label>
          <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3e4095] px-6 font-semibold text-white hover:bg-[#2c2f7a]">
            Send message
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section aria-label="Get started" className="px-5 pb-24 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden aurora-orange rounded-4xl p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
        <div>
          <p className={`${eyebrow} text-slate-900`}>Ready when you are</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Create a student account and start this week.</h2>
        </div>
        <Link href="/sign-up" className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#292b72] px-6 py-3.5 font-semibold text-white lg:mt-0">
          Start learning
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
