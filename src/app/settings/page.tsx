import type { Metadata } from "next";
import Settings from "@/features/portal/settings/Settings";

export const metadata: Metadata = {
  title: "Account settings",
  description: "View your account details and manage your password.",
};

export default function Page() {
  return <Settings />;
}
