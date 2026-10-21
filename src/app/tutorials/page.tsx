import type { Metadata } from "next";
import Tutorials from "@/features/portal/tutorials/Tutorials";
export const metadata: Metadata = {
  title: "Curriculum tutorials",
  description:
    "Browse curriculum lessons by subject, term, and week.",
};
export default function Page() {
  return <Tutorials />;
}
