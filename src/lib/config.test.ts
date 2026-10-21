import { describe, expect, it, vi } from "vitest";
import {
  getChangePasswordCapability,
  getDataSource,
  getRecoveryCapability,
  getRenewalCapability,
  getResendOtpCapability,
  isMockMode,
  safeNextPath,
} from "./config";
import { handleUnauthorized } from "./session";
import { useAuthStore } from "@/store/authStore";

describe("data source", () => {
  it("defaults to mock when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "");
    expect(getDataSource()).toBe("mock");
    expect(isMockMode()).toBe(true);
  });

  it("switches to api only for the exact value", () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    expect(getDataSource()).toBe("api");
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "API ");
    expect(getDataSource()).toBe("mock");
  });
});

describe("capabilities", () => {
  it("are all available in mock mode", () => {
    expect(getRenewalCapability().available).toBe(true);
    expect(getRecoveryCapability().available).toBe(true);
    expect(getResendOtpCapability().available).toBe(true);
  });

  it("need the live API base URL in api mode and explain why when it is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "  ");
    expect(getRenewalCapability()).toMatchObject({ available: false, reason: expect.stringContaining("support") });
    expect(getRecoveryCapability().available).toBe(false);
    expect(getResendOtpCapability().available).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    expect(getRenewalCapability()).toEqual({ available: true });
    expect(getRecoveryCapability()).toEqual({ available: true });
    expect(getResendOtpCapability()).toEqual({ available: true });
  });

  it("only offers changing the password in the demo, since the live API has no such call", () => {
    expect(getChangePasswordCapability().available).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    expect(getChangePasswordCapability()).toMatchObject({ available: false, reason: expect.stringMatching(/forgot password/i) });
  });
});

describe("safeNextPath", () => {
  it("accepts same-site absolute paths", () => {
    expect(safeNextPath("/tutorials?subject=math")).toBe("/tutorials?subject=math");
  });

  it.each([null, "", "https://evil.example", "//evil.example", "javascript:alert(1)", "/\\evil.example"])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/dashboard");
    },
  );
});

describe("session expiry", () => {
  const signedIn = () => useAuthStore.setState({ token: "t", user: null, userEnrollment: null });

  it("clears the session and sends the student to login when a signed-in request is unauthorized", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { pathname: "/transactions", search: "", assign });
    signedIn();
    handleUnauthorized("/user/accounts/fetch-user-subscription");
    expect(useAuthStore.getState().token).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?reason=session-expired&next=%2Ftransactions");
    vi.unstubAllGlobals();
  });

  it("ignores 401s from the login and signup endpoints (bad credentials)", () => {
    signedIn();
    handleUnauthorized("/user/auth/login");
    expect(useAuthStore.getState().token).toBe("t");
  });

  it("does nothing when nobody is signed in", () => {
    useAuthStore.setState({ token: null });
    expect(() => handleUnauthorized("/x")).not.toThrow();
  });
});
