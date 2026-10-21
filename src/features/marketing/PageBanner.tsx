import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedBackdrop from "./AnimatedBackdrop";

interface PageBannerProps {
  eyebrow: string;
  title: string;
  intro: string;
  cta?: { label: string; href: string };
}

/** Inner-page hero. Renders the page's only h1. */
export default function PageBanner({ eyebrow, title, intro, cta = { label: "Start as a student", href: "/sign-up" } }: PageBannerProps) {
  return (
    <section className="relative isolate bg-[#292b72] px-5 pb-16 pt-36 text-white sm:pt-40 lg:px-8 lg:pb-20">
      <AnimatedBackdrop />
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-[-.03em] sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-indigo-100">{intro}</p>
        <Link href={cta.href} className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#f39a2e] px-6 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">
          {cta.label}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
