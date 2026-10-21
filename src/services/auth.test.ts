import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));

import { liveCall } from "@/lib/live-api";
import {
  cancelSignupPayment,
  completeSignupSuccess,
  fetchDepartments,
  fetchExams,
  fetchPaymentMethods,
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
import { useAuthStore } from "@/store/authStore";
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
  beforeEach(() => vi.mocked(liveCall).mockReset());

  it("works in mock mode", async () => {
    await expect(requestPasswordRecovery("ada@example.com")).resolves.toEqual({ userId: "demo-ada@example.com" });
    await expect(resendSignupOtp("u")).resolves.toBeUndefined();
  });

  it("is unavailable in api mode until the API base URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    await expect(requestPasswordRecovery("ada@example.com")).rejects.toBeInstanceOf(FeatureUnavailableError);
    await expect(resendSignupOtp("u")).rejects.toBeInstanceOf(FeatureUnavailableError);
    expect(liveCall).not.toHaveBeenCalled();
  });

  it("asks the live API for a code and resends it by user id", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    vi.mocked(liveCall).mockResolvedValue({ success: true, message: "ok", user_id: "LTS-42" });
    await expect(requestPasswordRecovery("ada@example.com")).resolves.toEqual({ userId: "LTS-42" });
    expect(liveCall).toHaveBeenCalledWith("/user/auth/reset-password", { email: "ada@example.com" });

    await resendSignupOtp("LTS-42");
    expect(liveCall).toHaveBeenLastCalledWith("/user/auth/resend-otp", { user_id: "LTS-42" });
  });
});

const liveSession = {
  success: true,
  message: "Login successful! Welcome back",
  response: 200,
  user: [
    {
      user_id: "LTS-1",
      access_key: "live-key-1",
      fullname: "Ngozi Eze",
      email: "ngozi@example.com",
      mobile_no: "08012345678",
      wallet_balance: "2,500.00",
      status_name: "ACTIVE",
      last_login_time: "2026-10-20 09:00:00",
    },
  ],
  subscription: [
    {
      department_id: "DPT002",
      department_name: "JUNIOR",
      class_id: "CLS010",
      class_name: "JSS 2",
      subscription_start_date: "2026-10-01 10:00:00",
      subscription_end_date: "2026-10-31 10:00:00",
    },
  ],
};

describe("live API (api mode)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    vi.mocked(liveCall).mockReset();
  });

  it("lists departments, and classes only for a chosen department", async () => {
    vi.mocked(liveCall)
      .mockResolvedValueOnce({ success: true, message: "", data: [{ department_id: "DPT001", department_name: "BASIC" }] })
      .mockResolvedValueOnce({ success: true, message: "", data: [{ class_id: "CLS001", class_name: "BASIC 1" }] });

    await expect(fetchDepartments()).resolves.toEqual([{ value: "DPT001", label: "BASIC" }]);
    expect(liveCall).toHaveBeenLastCalledWith("/site/departments/fetch-department", { department_id: "" });

    await expect(fetchExams()).resolves.toEqual([]);
    await expect(fetchExams("DPT001")).resolves.toEqual([{ value: "CLS001", label: "BASIC 1" }]);
    expect(liveCall).toHaveBeenLastCalledWith("/site/department-class-subject/fetch-class-by-department", {
      department_id: "DPT001",
    });
  });

  it("offers only online payment at sign-up", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      success: true,
      message: "",
      data: [
        { payment_method_id: "DO", payment_method_name: "DIRECT ONLINE PAYMENT" },
        { payment_method_id: "WAL", payment_method_name: "WALLET PAYMENT" },
        { payment_method_id: "SYS", payment_method_name: "SYSTEM" },
      ],
    });
    await expect(fetchPaymentMethods()).resolves.toEqual([{ value: "DO", label: "DIRECT ONLINE PAYMENT" }]);
  });

  it("logs in with the email as the username", async () => {
    vi.mocked(liveCall).mockResolvedValue(liveSession);
    await loginUser({ emailAddress: "ngozi@example.com", password: "secret12" });
    expect(liveCall).toHaveBeenCalledWith("/user/auth/login", { username: "ngozi@example.com", password: "secret12" });
  });

  it("turns a login reply into the app session, with the class and wallet", () => {
    const { token, user, account } = normalizeAuthResponse(liveSession, "fallback@b.co");
    expect(token).toBe("live-key-1");
    expect(user).toMatchObject({
      id: "LTS-1",
      email: "ngozi@example.com",
      first_name: "Ngozi",
      last_name: "Eze",
      phone_number: "08012345678",
      status: "ACTIVE",
      departmentId: "DPT002",
      departmentName: "JUNIOR",
      examId: "CLS010",
      examAbbreviation: "JSS 2",
    });
    expect(account).toMatchObject({
      walletBalance: 2500,
      subscription: { className: "JSS 2", endDate: "2026-10-31 10:00:00" },
    });
  });

  it("sends the sign-up fields the live site sends, with the referral", async () => {
    vi.mocked(liveCall).mockResolvedValue({ success: true, message: "", user_id: "LTS-2" });
    const payload = mapSignupPayload(
      {
        fullName: "Ngozi Eze",
        emailAddress: "ngozi@example.com",
        phoneNumber: "08012345678",
        department: "DPT002",
        exam: "CLS010",
        password: "secret12",
        confirmPassword: "secret12",
        referralCode: " AGENT-7 ",
      },
      { paymentMethodId: "DO" },
    );
    await signupUser(payload);
    expect(liveCall).toHaveBeenCalledWith("/user/auth/signup", {
      fullname: "Ngozi Eze",
      email: "ngozi@example.com",
      mobile_no: "08012345678",
      department_id: "DPT002",
      class_id: "CLS010",
      create_password: "secret12",
      confirm_password: "secret12",
      referral_type: "code",
      referral_id: "AGENT-7",
    });
  });

  it("prefers a referral link over a typed code", () => {
    const payload = mapSignupPayload(
      { fullName: "A", emailAddress: "a@b.co", phoneNumber: "0801", department: "d", exam: "e", password: "p", confirmPassword: "p", referralCode: "typed" },
      { paymentMethodId: "DO", referralLinkId: "LTS-9" },
    );
    expect(payload.referral).toEqual({ type: "link", id: "LTS-9" });
  });

  it("reads the payment to make, and the key that confirms it, from the sign-up reply", () => {
    const payload = mapSignupPayload(
      { fullName: "Ngozi Eze", emailAddress: "ngozi@example.com", phoneNumber: "0801", department: "d", exam: "e", password: "p", confirmPassword: "p" },
      { paymentMethodId: "DO" },
    );
    const pending = getSignupVerificationData(
      {
        success: true,
        message: "",
        user_id: "LTS-2",
        access_key: "new-key",
        subscription_id: "SUB-1",
        transaction_id: "TRX-9",
        amount: "1000.00",
        email: "ngozi@example.com",
        paystack_payment_key: "pk_test_x",
        referral_type: "code",
        referral_id: "",
      },
      payload,
    );
    expect(pending).toMatchObject({
      userId: "LTS-2",
      emailAddress: "ngozi@example.com",
      paymentProceedData: {
        transactionId: "TRX-9",
        amount: "1000.00",
        paystackPaymentKey: "pk_test_x",
        accessKey: "new-key",
        subscriptionId: "SUB-1",
      },
    });
  });

  it("confirms the sign-up payment with the new account's key", async () => {
    const payload = mapSignupPayload(
      { fullName: "Ngozi Eze", emailAddress: "ngozi@example.com", phoneNumber: "0801", department: "d", exam: "e", password: "p", confirmPassword: "p" },
      { paymentMethodId: "DO" },
    );
    savePendingSignupVerification(
      getSignupVerificationData(
        { success: true, message: "", user_id: "LTS-2", access_key: "new-key", subscription_id: "SUB-1", transaction_id: "TRX-9", amount: "1000.00", paystack_payment_key: "pk_test_x" },
        payload,
      ),
    );
    vi.mocked(liveCall).mockResolvedValue(liveSession);

    await completeSignupSuccess("TRX-9", "pk_test_x");
    expect(liveCall).toHaveBeenCalledWith(
      "/user/auth/signup-complete",
      expect.objectContaining({ user_id: "LTS-2", transaction_id: "TRX-9", subscription_id: "SUB-1", amount: "1000.00" }),
      { token: "new-key" },
    );

    await cancelSignupPayment();
    expect(liveCall).toHaveBeenLastCalledWith("/user/auth/signup-cancelled", {}, { token: "new-key" });
  });

  it("sets a new password with the emailed code", async () => {
    vi.mocked(liveCall).mockResolvedValue({ success: true, message: "" });
    await verifySignupOtp({ userId: "LTS-1", otp: 123456, password: "newpass1", confirmPassword: "newpass1" });
    expect(liveCall).toHaveBeenCalledWith("/user/auth/create-new-password", {
      user_id: "LTS-1",
      otp: 123456,
      password: "newpass1",
      confirm_password: "newpass1",
    });
  });

  it("keeps the wallet and plan from the login reply in the session store", () => {
    const { token, user, account } = normalizeAuthResponse(liveSession, "x@y.co");
    useAuthStore.getState().setAuth(user, token, account);
    expect(useAuthStore.getState().account?.walletBalance).toBe(2500);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().account).toBeNull();
  });
});
