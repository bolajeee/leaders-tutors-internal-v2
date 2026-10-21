import type { Metadata } from "next";
import Subscriptions from "@/features/portal/subscriptions/Subscriptions";

export const metadata: Metadata = {
  title: "Subscriptions",
  description:
    "View your subscription history on Leaders Tutors, including active and past plans, due dates, and related status updates.",
};

export default function Page() {
  return <Subscriptions />;
}
