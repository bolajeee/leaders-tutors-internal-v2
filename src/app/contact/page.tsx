import type { Metadata } from "next";
import { ContactPage } from "@/features/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach Leaders Tutors by phone, email or visit us in Lagos Island.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
