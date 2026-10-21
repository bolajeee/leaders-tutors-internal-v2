// store/authStore.ts
import { AuthResponse } from "@/types/auth/auth";
import { UserEnrollment } from "@/types/portal";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      setAuth: (user, token) => set({ user, token }),
      setUserEnrollment: (enrollment) => set({ userEnrollment: enrollment }),
      clearAuth: () => set({ user: null, token: null, userEnrollment: null }),
    }),
    {
      name: "auth-storage", // localStorage key
    },
  ),
);
