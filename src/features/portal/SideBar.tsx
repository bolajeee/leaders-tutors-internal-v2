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
  `group relative whitespace-nowrap flex items-center justify-center md:justify-start gap-3 cursor-pointer px-2 md:px-4 py-3 rounded-xl text-sm font-medium-custom transition-all duration-200 ${
    active
      ? "bg-brand-gradient text-white shadow-glow"
      : "text-slate-600 hover:bg-primary-light/70 hover:text-primary"
  }`;

const iconClasses = (active: boolean) =>
  `inline-block shrink-0 transition-transform duration-200 group-hover:scale-110 ${
    active ? "text-white" : "text-primary"
  }`;

export const SideBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <section className="fixed w-16 md:w-56 h-full border-r border-primary/10 bg-white left-0 top-0 flex flex-col justify-between items-center">
      <div className="w-full p-2 md:p-4 flex flex-col gap-8 md:gap-10 items-start">
        <div className="w-full md:w-35 py-3 md:py-0">
          <Image
            src="/body-pix/logo.png"
            alt="Leaders Tutors"
            className="w-full h-auto"
            width={0}
            height={0}
            unoptimized
          />
        </div>
        <nav className="w-full">
          <p className="mb-2 hidden px-4 text-[11px] uppercase tracking-widest text-slate-400 md:block">
            Menu
          </p>
          <ul className="flex flex-col gap-1.5">
            {SIDEBAR_TOP_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  href={link.href}
                  key={link.name}
                  title={link.name}
                  aria-current={active ? "page" : undefined}
                >
                  <li className={linkClasses(active)}>
                    {link.icon && (
                      <link.icon size={18} className={iconClasses(active)} />
                    )}
                    <span className="sr-only md:not-sr-only">{link.name}</span>
                  </li>
                </Link>
              );
            })}
          </ul>
        </nav>
      </div>
      <nav className="w-full p-2 md:p-4 border-t border-slate-100">
        <ul className="flex flex-col gap-1.5">
          {SIDEBAR_BOTTOM_LINKS.map((link) => {
            if (link.href === "#") {
              return (
                <li key={link.name} className="list-none">
                  <button
                    type="button"
                    title={link.name}
                    onClick={handleLogout}
                    className={`${linkClasses(false)} w-full`}
                  >
                    {link.icon && (
                      <link.icon size={18} className={iconClasses(false)} />
                    )}
                    <span className="sr-only md:not-sr-only">{link.name}</span>
                  </button>
                </li>
              );
            }
            const active = pathname === link.href;
            return (
              <Link href={link.href} key={link.name} title={link.name}>
                <li className={linkClasses(active)}>
                  {link.icon && (
                    <link.icon size={18} className={iconClasses(active)} />
                  )}
                  <span className="sr-only md:not-sr-only">{link.name}</span>
                </li>
              </Link>
            );
          })}
        </ul>
      </nav>
    </section>
  );
};
