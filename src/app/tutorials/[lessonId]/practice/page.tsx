import type { Metadata } from "next";
import PracticeView from "@/features/portal/tutorials/PracticeView";

export const metadata: Metadata = {
  title: "CBT practice",
  description: "Practise what you learned in your Leaders Tutors lesson.",
};

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <PracticeView lessonId={lessonId} />;
}
