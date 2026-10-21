"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
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
  stats,
  telHref,
  testimonials,
} from "@/data/marketing";

const eyebrow = "text-xs font-bold uppercase tracking-[.2em]";

export function Hero() {
  const [before, after] = hero.headline.split(hero.highlight);
  return (
    <section className="relative isolate bg-[#292b72] px-5 pb-20 pt-36 text-white sm:pt-44 lg:px-8 lg:pb-28">
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-[#f39a2e]/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>
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
            <Link href={hero.primaryCta.href} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#f39a2e] px-6 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">
              {hero.primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href={hero.secondaryCta.href} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white hover:bg-white/10">
              <PlayCircle className="h-5 w-5" aria-hidden />
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-6 text-slate-900 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-[#3e4095]">Your curriculum</span>
                <GraduationCap className="text-[#f39a2e]" aria-hidden />
              </div>
              <p className="mt-7 text-2xl font-bold">Your learning, clearly organised.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Move naturally from a subject to the right term, week and lesson.</p>
              <ul className="mt-7 space-y-3">
                {["Basic Science · First Term · Week 1", "Mathematics · First Term · Week 2", "English Studies · First Term · Week 1"].map((item, index) => (
                  <li key={item} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 0 ? "bg-[#3e4095] text-white" : "bg-white text-[#3e4095]"}`}>
                      <BookOpenCheck className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{item}</span>
                      <span className="mt-1 block text-xs text-slate-600">Video, notes and practice</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden />
                  </li>
                ))}
              </ul>
            </div>
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

export function PopularClasses({ showAllLink = false }: { showAllLink?: boolean }) {
  return (
    <section aria-labelledby="classes-heading" className="bg-[#f7f7fb] px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className={`${eyebrow} text-amber-800`}>Popular classes</p>
          <h2 id="classes-heading" className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Built around the learner you are becoming.</h2>
          <p className="mt-4 leading-7 text-slate-600">A taste of the classes students open every day, from Basic school to junior secondary.</p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classPreviews.map((item, index) => (
            <li key={`${item.level}-${item.subject}`}>
              <article className="group h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#3e4095]">{item.level}</span>
                <div className="my-6 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-[#3e4095]" aria-hidden>
                  <span className="text-xl font-bold">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold">{item.subject}</h3>
                <p className="mt-2 text-sm text-slate-600">Taught by {item.tutor}</p>
                <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#3e4095]">
                  Find your class
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  <span className="sr-only">: {item.level} {item.subject}</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
        {showAllLink && (
          <Link href="/available-tutorials" className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#3e4095] px-6 font-semibold text-white hover:bg-[#2c2f7a]">
            Explore all classes
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        )}
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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#f39a2e] p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
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
