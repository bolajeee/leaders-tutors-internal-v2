"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { LoadingScreen } from "@/components/general-components/compnents";
import { SideBar } from "@/features/portal/SideBar";
import { useAuthStore } from "@/store/authStore";

type AuthWrapperProps = {
  children: ReactNode;
};

export const PortalWrapper = ({ children }: AuthWrapperProps) => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  if (!token) {
    return <LoadingScreen message="Restoring session..." />;
  }

  return (
    <main className="m-0 p-0 fixed w-full h-full bg-white">
      <SideBar />
      <section className="fixed w-[calc(100%-64px)] md:w-[calc(100%-224px)] h-full right-0 top-0 flex flex-col justify-between items-center">
        <Header />
        <section className="absolute w-full h-[calc(100%-60px)] bottom-0 overflow-y-auto bg-canvas">
          {children}
        </section>
      </section>
    </main>
  );
};
