import type { Metadata } from "next";
import Dashboard from "@/features/portal/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Student dashboard",
  description:
    "See your lessons, subscription, wallet, and learning progress.",
};
export default function Page() {
  return <Dashboard />;
}
