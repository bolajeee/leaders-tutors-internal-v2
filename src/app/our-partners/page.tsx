import type { Metadata } from "next";
import { PartnersPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Our Partners",
  description: "The partners learning alongside Leaders Tutors.",
  alternates: { canonical: "/our-partners" },
};

export default function Page() {
  return <PartnersPage />;
}
