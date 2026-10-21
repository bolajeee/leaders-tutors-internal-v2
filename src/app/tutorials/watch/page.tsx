import type { Metadata } from "next";
import { Suspense } from "react";
import TutorialWatch from "@/features/portal/tutorials/TutorialWatch";

export const metadata: Metadata = {
  title: "Watch tutorial",
  description:
    "Watch comprehensive video tutorials for external exams. Access high-quality educational content to help you prepare for WAEC, NECO, JAMB, and other external examinations.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <TutorialWatch />
    </Suspense>
  );
}
