import type { Metadata } from "next";
import LessonView from "@/features/portal/tutorials/LessonView";

export const metadata: Metadata = { title: "Lesson", description: "Watch your Leaders Tutors lesson and open its learning resources." };

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonView lessonId={lessonId} />;
}
