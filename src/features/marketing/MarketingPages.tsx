import Link from "next/link";
import { ArrowRight, Handshake, UsersRound } from "lucide-react";
import { agents, pageBanners, partners, partnersIntro } from "@/data/marketing";
import MarketingShell from "./MarketingShell";
import PageBanner from "./PageBanner";
import { CallToAction, Contact, Faq, HowItWorks, PopularClasses, Stats } from "./Sections";

export function HowItWorksPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.howItWorks} />
      <HowItWorks />
      <Stats />
      <CallToAction />
    </MarketingShell>
  );
}

export function TutorialsPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.tutorials} />
      <PopularClasses />
      <CallToAction />
    </MarketingShell>
  );
}

export function AgentsPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.agents} cta={agents.cta} />
      <section aria-labelledby="agents-heading" className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.4fr_1.6fr]">
          <div className="grid h-40 w-40 place-items-center rounded-[2rem] bg-indigo-50 text-[#3e4095]" aria-hidden>
            <UsersRound className="h-20 w-20" />
          </div>
          <div>
            <h2 id="agents-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">Grow with Leaders Tutors.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">{agents.intro}</p>
            <Link href={agents.cta.href} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#3e4095] px-6 font-semibold text-white hover:bg-[#2c2f7a]">
              {agents.cta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export function PartnersPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.partners} />
      <section aria-labelledby="partners-heading" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 id="partners-heading" className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">Learn with our partners.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">{partnersIntro}</p>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => (
              <li key={partner} className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-[#3e4095]" aria-hidden>
                  <Handshake className="h-7 w-7" />
                </span>
                <span className="text-lg font-bold">{partner}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CallToAction />
    </MarketingShell>
  );
}

export function FaqPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.faq} />
      <Faq />
      <CallToAction />
    </MarketingShell>
  );
}

export function ContactPage() {
  return (
    <MarketingShell>
      <PageBanner {...pageBanners.contact} />
      <Contact />
    </MarketingShell>
  );
}
