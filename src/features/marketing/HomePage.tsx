import MarketingShell from "./MarketingShell";
import { Benefits, CallToAction, Hero, HowItWorks, Partners, PopularClasses, Stats, Testimonials } from "./Sections";

/** Mirrors the live home page: hero, stats, popular classes, how it works, about, testimonials, partners, CTA. */
export default function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <Stats />
      <PopularClasses showAllLink />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Partners />
      <CallToAction />
    </MarketingShell>
  );
}
