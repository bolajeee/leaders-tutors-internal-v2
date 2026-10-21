import { beforeEach, describe, expect, it } from "vitest";
import { SESSION_COOKIE, useAuthStore } from "./authStore";
import type { AuthResponse } from "@/types/auth/auth";

const user: AuthResponse = {
  token: "tok-123",
  id: "u1",
  email: "ada@example.com",
  first_name: "Ada",
  last_name: "Obi",
  phone_number: null,
  last_active: "2026-01-01T00:00:00.000Z",
  role: "Student",
  status: "Active",
  middle_name: null,
};

const storedSession = () => JSON.parse(window.localStorage.getItem("auth-storage") ?? "null");

describe("auth store persistence", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("persists the session and sets the routing cookie on sign-in", () => {
    useAuthStore.getState().setAuth(user, "tok-123");
    expect(storedSession().state.token).toBe("tok-123");
    expect(document.cookie).toContain(`${SESSION_COOKIE}=1`);
  });

  it("clears the stored session and the cookie on sign-out", () => {
    useAuthStore.getState().setAuth(user, "tok-123");
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(storedSession().state.token).toBeNull();
    expect(document.cookie).not.toContain(`${SESSION_COOKIE}=1`);
  });

  it("restores a stored session on reload and re-sets the cookie", async () => {
    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { user, token: "restored", userEnrollment: null }, version: 0 }),
    );
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().token).toBe("restored");
    expect(document.cookie).toContain(`${SESSION_COOKIE}=1`);
  });

  it("keeps the enrollment alongside the session", () => {
    useAuthStore.getState().setAuth(user, "tok-123");
    useAuthStore.getState().setUserEnrollment({
      departmentId: "1",
      departmentName: "Basic",
      examId: "5",
      examAbbreviation: "Basic 5",
    });
    expect(storedSession().state.userEnrollment.examAbbreviation).toBe("Basic 5");
  });
});
