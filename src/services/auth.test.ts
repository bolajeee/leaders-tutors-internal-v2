import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

import { apiClient } from "@/lib/api-client";
import {
  completeSignupSuccess,
  getSignupVerificationData,
  loginUser,
  mapSignupPayload,
  normalizeAuthResponse,
  readPendingSignupVerification,
  requestPasswordRecovery,
  resendSignupOtp,
  savePendingSignupVerification,
  signupUser,
  verifySignupOtp,
} from "./auth";
import { useDemoStore, daysUntil } from "./mock/demoStore";
import { FeatureUnavailableError } from "@/lib/errors";
import { MOCK_OTP, MOCK_TAKEN_EMAIL, MOCK_WRONG_PASSWORD } from "./mock/directory";

describe("normalizeAuthResponse", () => {
  it("reads the token and profile from a flat login response", () => {
    const { token, user } = normalizeAuthResponse(
      { accessKey: "key-1", userId: "u9", emailAddress: "a@b.co", fullName: "Ada Obi Eze", role: "Student" },
      "fallback@b.co",
    );
    expect(token).toBe("key-1");
    expect(user).toMatchObject({ id: "u9", email: "a@b.co", first_name: "Ada", last_name: "Obi Eze", role: "Student" });
  });

  it("reads a response nested under data and coerces numeric enrollment ids", () => {
    const { user } = normalizeAuthResponse(
      {
        data: {
          accessToken: "key-2",
          fullName: "Chi",
          departmentData: { departmentId: 1, departmentName: "Basic" },
          examData: { examId: 5, examAbbreviation: "Basic 5" },
        },
      },
      "x@y.co",
    );
    expect(user).toMatchObject({
      email: "x@y.co",
      first_name: "Chi",
      last_name: "Account",
      departmentId: "1",
      departmentName: "Basic",
      examId: "5",
      examAbbreviation: "Basic 5",
    });
  });

  it("refuses a response with no token", () => {
    expect(() => normalizeAuthResponse({ fullName: "No Token" }, "a@b.co")).toThrow(/no access token/i);
  });
});

describe("signup verification data", () => {
  const payload = mapSignupPayload(
    { fullName: " Ada Obi ", emailAddress: " ada@example.com ", phoneNumber: "0801 234 5678", department: "1", exam: "2", password: "secret1", confirmPassword: "secret1" },
    { paymentMethodId: "CC" },
  );

  it("trims the payload and keeps the payment method", () => {
    expect(payload).toMatchObject({ fullName: "Ada Obi", emailAddress: "ada@example.com", departmentId: "1", examId: "2", paymentMethodId: "CC" });
  });

  it("finds the user id and payment details wherever the API puts them", () => {
    expect(getSignupVerificationData({ data: { id: 55 } as never }, payload).userId).toBe("55");
    expect(getSignupVerificationData({}, payload).userId).toMatch(/^temp_/);
    const flat = getSignupVerificationData({ userId: "u1", paymentProceedData: { transactionId: "T1", amount: 1000 } as never }, payload);
    expect(flat).toMatchObject({ userId: "u1", emailAddress: "ada@example.com", paymentProceedData: { transactionId: "T1" } });
    const nested = getSignupVerificationData({ data: { userId: "u2" } as never }, payload);
    expect(nested.userId).toBe("u2");
  });

  it("round-trips the pending signup through session storage", () => {
    const pending = getSignupVerificationData({ userId: "u1" }, payload);
    savePendingSignupVerification(pending);
    expect(readPendingSignupVerification()).toMatchObject({ userId: "u1" });
  });
});

describe("mock authentication", () => {
  beforeEach(() => useDemoStore.getState().reset());

  it("signs in any valid account and seeds an active plan", async () => {
    const response = await loginUser({ emailAddress: "Student@LeadersTutors.com", password: "demo-password" });
    expect(response).toMatchObject({ emailAddress: "student@leaderstutors.com", fullName: "Student" });
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(30);
  });

  it("seeds an expired plan for the expired demo account", async () => {
    await loginUser({ emailAddress: "expired.student@leaderstutors.com", password: "demo-password" });
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(0);
  });

  it("keeps renewals across logins of the same account", async () => {
    await loginUser({ emailAddress: "expired.student@leaderstutors.com", password: "demo-password" });
    useDemoStore.getState().renew();
    await loginUser({ emailAddress: "expired.student@leaderstutors.com", password: "demo-password" });
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBeGreaterThan(0);
  });

  it("rejects the wrong password with a 401-style error", async () => {
    await expect(loginUser({ emailAddress: "a@b.co", password: MOCK_WRONG_PASSWORD })).rejects.toMatchObject({
      message: "Invalid email or password.",
      status: 401,
    });
  });

  it("rejects an address that is already registered", async () => {
    await expect(signupUser(mapSignupPayload(
      { fullName: "A B", emailAddress: MOCK_TAKEN_EMAIL, phoneNumber: "08012345678", department: "basic", exam: "basic-5", password: "secret1", confirmPassword: "secret1" },
      { paymentMethodId: "CC" },
    ))).rejects.toMatchObject({ status: 409 });
  });

  it("accepts only the demo verification code", async () => {
    const base = { userId: "u", password: "secret12", confirmPassword: "secret12" };
    await expect(verifySignupOtp({ ...base, otp: 111111 })).rejects.toThrow(/isn't correct/);
    await expect(verifySignupOtp({ ...base, otp: Number(MOCK_OTP) })).resolves.toEqual({ success: true });
  });

  it("creates an active account from the pending signup after payment", async () => {
    const payload = mapSignupPayload(
      { fullName: "Ngozi Eze", emailAddress: "ngozi@example.com", phoneNumber: "08012345678", department: "junior", exam: "jss-2", password: "secret1", confirmPassword: "secret1" },
      { paymentMethodId: "CC" },
    );
    savePendingSignupVerification(getSignupVerificationData(await signupUser(payload), payload));

    const response = await completeSignupSuccess("SIGNUP-1", "pk_test_local_demo");
    const { token, user } = normalizeAuthResponse(response, "ngozi@example.com");
    expect(token).toMatch(/^mock-session-/);
    expect(user).toMatchObject({ first_name: "Ngozi", examAbbreviation: "JSS 2", departmentName: "Junior Secondary" });
    const demo = useDemoStore.getState();
    expect(daysUntil(demo.subscriptionEndsAt)).toBe(30);
    expect(demo.transactions).toHaveLength(1);
    expect(demo.transactions[0]).toMatchObject({ id: "SIGNUP-1", status: "success", description: "Registration payment" });
  });

  it("cannot complete signup without a pending signup session", async () => {
    await expect(completeSignupSuccess("T", "k")).rejects.toThrow(/expired/i);
  });
});

describe("password recovery and code resend", () => {
  beforeEach(() => vi.mocked(apiClient.post).mockReset());

  it("works in mock mode", async () => {
    await expect(requestPasswordRecovery("ada@example.com")).resolves.toEqual({ userId: "demo-ada@example.com" });
    await expect(resendSignupOtp("u")).resolves.toBeUndefined();
  });

  it("is unavailable in api mode until an endpoint is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_PASSWORD_RECOVERY_PATH", "");
    vi.stubEnv("NEXT_PUBLIC_RESEND_OTP_PATH", "");
    await expect(requestPasswordRecovery("ada@example.com")).rejects.toBeInstanceOf(FeatureUnavailableError);
    await expect(resendSignupOtp("u")).rejects.toBeInstanceOf(FeatureUnavailableError);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("uses the configured endpoint in api mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_PASSWORD_RECOVERY_PATH", "/user/auth/forgot-password");
    vi.mocked(apiClient.post).mockResolvedValue({ userId: "real-42" });
    await expect(requestPasswordRecovery("ada@example.com")).resolves.toEqual({ userId: "real-42" });
    expect(apiClient.post).toHaveBeenCalledWith("/user/auth/forgot-password", { emailAddress: "ada@example.com" });
  });
});
