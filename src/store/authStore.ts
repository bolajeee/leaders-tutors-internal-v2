// store/authStore.ts
import { AuthResponse } from "@/types/auth/auth";
import { UserEnrollment } from "@/types/portal";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryClient } from "@/lib/query-client";

/**
 * Non-secret marker cookie so the server-side proxy can route signed-out
 * visitors before the page renders. The bearer token itself stays in the
 * persisted store; the API remains the authority on whether it is valid.
 */
export const SESSION_COOKIE = "lt_session";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const syncSessionCookie = (active: boolean) => {
  if (typeof document === "undefined") return;
  document.cookie = active
    ? `${SESSION_COOKIE}=1; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`
    : `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};

interface AuthState {
  user: AuthResponse | null;
  token: string | null;
  userEnrollment: UserEnrollment | null;
  setAuth: (user: AuthResponse, token: string) => void;
  setUserEnrollment: (enrollment: UserEnrollment) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      userEnrollment: null,
      setAuth: (user, token) => {
        syncSessionCookie(true);
        set({ user, token });
      },
      setUserEnrollment: (enrollment) => set({ userEnrollment: enrollment }),
      clearAuth: () => {
        syncSessionCookie(false);
        queryClient.clear();
        set({ user: null, token: null, userEnrollment: null });
      },
    }),
    {
      name: "auth-storage", // localStorage key
      // Keep the cookie consistent with whatever session was restored.
      onRehydrateStorage: () => (state) => syncSessionCookie(Boolean(state?.token)),
    },
  ),
);
