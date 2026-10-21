"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { LoadingScreen } from "@/components/general-components/compnents";
import { SideBar } from "@/features/portal/SideBar";
import { useAuthStore } from "@/store/authStore";
import { useHydrated } from "@/hooks/useHydrated";
import { isMockMode } from "@/lib/config";
import { loginUrl } from "@/lib/routes";

type AuthWrapperProps = {
  children: ReactNode;
};

export const PortalWrapper = ({ children }: AuthWrapperProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Wait for the persisted session to load before deciding the visitor is signed out.
    if (hydrated && !token) router.replace(loginUrl({ next: pathname }));
  }, [hydrated, router, token, pathname]);

  if (!hydrated || !token) {
    return <LoadingScreen message="Restoring session..." />;
  }

  return (
    <div className="fixed inset-0 bg-white">
      <a
        href="#portal-content"
        className="sr-only z-[80] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--primary-color)] shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <SideBar />
      <div className="fixed right-0 top-0 flex h-full w-[calc(100%-64px)] flex-col md:w-[calc(100%-224px)]">
        <Header />
        {isMockMode() && (
          <p
            role="note"
            className="shrink-0 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-950"
          >
            Demo mode: sample lessons, wallet and payments. Nothing here is real.
          </p>
        )}
        <main
          id="portal-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto bg-canvas outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
