"use client";
import {
  SIDEBAR_TOP_LINKS,
  SIDEBAR_BOTTOM_LINKS,
} from "@/constants/portal/navlinks";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const linkClasses = (active: boolean) =>
  `group relative whitespace-nowrap flex w-full items-center justify-center md:justify-start gap-3 cursor-pointer px-2 md:px-4 py-3 min-h-11 rounded-xl text-sm font-medium-custom transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary-color) ${
    active
      ? "bg-brand-gradient text-white shadow-glow"
      : "text-slate-700 hover:bg-primary-light/70 hover:text-primary"
  }`;

const iconClasses = (active: boolean) =>
  `inline-block shrink-0 transition-transform duration-200 group-hover:scale-110 ${
    active ? "text-white" : "text-primary"
  }`;

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const SideBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 flex h-full w-16 flex-col items-center justify-between border-r border-primary/10 bg-white md:w-56">
      <div className="flex w-full flex-col items-start gap-8 overflow-y-auto p-2 md:gap-10 md:p-4">
        <Link href="/dashboard" aria-label="Leaders Tutors dashboard" className="w-full py-3 md:w-35 md:py-0">
          <Image
            src="/body-pix/logo.png"
            alt="Leaders Tutors"
            className="h-auto w-full"
            width={0}
            height={0}
            unoptimized
          />
        </Link>
        <nav aria-label="Student portal" className="w-full">
          <p className="mb-2 hidden px-4 text-[11px] uppercase tracking-widest text-slate-600 md:block">
            Menu
          </p>
          <ul className="flex flex-col gap-1.5">
            {SIDEBAR_TOP_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    title={link.name}
                    aria-current={active ? "page" : undefined}
                    className={linkClasses(active)}
                  >
                    {link.icon && <link.icon size={18} aria-hidden className={iconClasses(active)} />}
                    <span className="sr-only md:not-sr-only">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <nav aria-label="Account" className="w-full border-t border-slate-100 p-2 md:p-4">
        <ul className="flex flex-col gap-1.5">
          {SIDEBAR_BOTTOM_LINKS.map((link) => {
            if (link.href === "#") {
              return (
                <li key={link.name}>
                  <button
                    type="button"
                    title={link.name}
                    onClick={handleLogout}
                    className={linkClasses(false)}
                  >
                    {link.icon && <link.icon size={18} aria-hidden className={iconClasses(false)} />}
                    <span className="sr-only md:not-sr-only">{link.name}</span>
                  </button>
                </li>
              );
            }
            const active = isActive(pathname, link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  title={link.name}
                  aria-current={active ? "page" : undefined}
                  className={linkClasses(active)}
                >
                  {link.icon && <link.icon size={18} aria-hidden className={iconClasses(active)} />}
                  <span className="sr-only md:not-sr-only">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
