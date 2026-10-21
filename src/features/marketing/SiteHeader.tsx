"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks, siteName } from "@/data/marketing";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? ("page" as const) : undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#292b72]/95 text-white backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#292b72] focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="rounded-xl bg-white px-3 py-2" aria-label={`${siteName} home`}>
          <Image src="/body-pix/logo.png" alt={siteName} width={154} height={54} className="h-10 w-auto" priority />
        </Link>
        <nav className="hidden items-center gap-5 xl:gap-7 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current(link.href)} className="rounded-md border-b-2 border-transparent py-1 text-sm font-medium text-white/90 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white aria-[current=page]:border-[#f39a2e] aria-[current=page]:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            My account
          </Link>
          <Link href="/sign-up" className="rounded-xl bg-[#f39a2e] px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-[#ffad49]">
            Start learning
          </Link>
        </div>
        <button
          ref={toggle}
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-white/10 px-5 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={current(link.href)} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/90 hover:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:font-semibold aria-[current=page]:text-white">
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" className="rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-semibold">
                My account
              </Link>
              <Link href="/sign-up" className="rounded-xl bg-[#f39a2e] px-4 py-3 text-center text-sm font-semibold text-slate-950">
                Start learning
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
