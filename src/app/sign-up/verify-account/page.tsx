import { OtpVerification } from "@/features/onboarding/OtpVerification";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Verify student account",
  description: "Verify your email before completing your Leaders Tutors registration.",
};
export default function Page() {
  return <OtpVerification />;
}
