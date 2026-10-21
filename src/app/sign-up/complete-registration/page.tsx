import { CompleteRegistration } from "@/features/onboarding/CompleteRegistration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Registration - Leaders Tutors",
  description:
    "Complete your registration by setting up your password and making payment.",
};

export default function Page() {
  return <CompleteRegistration />;
}
