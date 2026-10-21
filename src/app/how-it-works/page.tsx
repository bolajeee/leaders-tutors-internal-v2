import type { Metadata } from "next";
import { HowItWorksPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "How it Works",
  description: "How Leaders Tutors works: sign up, subscribe, get your tutorials and earn points.",
  alternates: { canonical: "/how-it-works" },
};

export default function Page() {
  return <HowItWorksPage />;
}
