import type { Metadata } from "next";
import { AgentsPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Our Agents",
  description: "Become a Leaders Tutors agent and help students get started.",
  alternates: { canonical: "/our-agents" },
};

export default function Page() {
  return <AgentsPage />;
}
