import type { Metadata } from "next";
import Login from "@/features/auth/Login";

export const metadata: Metadata = {
  title: "Student login",
  description: "Sign in to your Leaders Tutors learning portal.",
};

export default function Page() {
  return <Login />;
}
