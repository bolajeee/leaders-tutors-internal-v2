import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { social } from "@/data/marketing";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/** Header, footer and floating help button shared by every marketing page. */
export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <a
        href={social.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        <span className="sr-only sm:not-sr-only">Chat with us on WhatsApp</span>
      </a>
    </div>
  );
}
