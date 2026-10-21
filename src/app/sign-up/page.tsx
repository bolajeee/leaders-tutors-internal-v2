import type { Metadata } from "next";
import { Suspense } from "react";
import SignUp from "@/features/onboarding/SignUp";
export const metadata: Metadata = {
  title: "Create student account",
  description: "Create a Leaders Tutors student account and select your learning class.",
};
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>
  );
}
