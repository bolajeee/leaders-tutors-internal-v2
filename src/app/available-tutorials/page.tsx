import type { Metadata } from "next";
import { TutorialsPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Available Tutorials",
  description: "Browse online video classes for Basic, Junior, Science, Commercial and Art students.",
  alternates: { canonical: "/available-tutorials" },
};

export default function Page() {
  return <TutorialsPage />;
}
