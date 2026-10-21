import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import {
  Benefits,
  CallToAction,
  Contact,
  Faq,
  Hero,
  HowItWorks,
  Partners,
  PopularClasses,
  Stats,
  Testimonials,
} from "./Sections";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <SiteHeader />
      <main id="main">
        <Hero />
        <Stats />
        <PopularClasses />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Partners />
        <Faq />
        <Contact />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  );
}
