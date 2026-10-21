import type { Metadata } from "next";
import { FaqPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Leaders Tutors classes, payments and access.",
  alternates: { canonical: "/faq" },
};

export default function Page() {
  return <FaqPage />;
}
