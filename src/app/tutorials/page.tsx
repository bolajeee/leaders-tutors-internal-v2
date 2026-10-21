import type { Metadata } from "next";
import { Suspense } from "react";
import Tutorials from "@/features/portal/tutorials/Tutorials";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Browse your Leaders Tutors curriculum by subject, term and week.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Tutorials />
    </Suspense>
  );
}
