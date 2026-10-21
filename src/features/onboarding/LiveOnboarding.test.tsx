import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));
vi.mock("@/services/paystack", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/paystack")>()),
  loadPaystackScript: vi.fn().mockResolvedValue(undefined),
  initializePaystackPayment: vi.fn(),
}));

import SignUp from "./SignUp";
import * as toast from "@/components/toast";
import { CompleteRegistration } from "./CompleteRegistration";
import { liveCall } from "@/lib/live-api";
import { initializePaystackPayment, loadPaystackScript } from "@/services/paystack";
import {
  getSignupVerificationData,
  mapSignupPayload,
  readPendingSignupVerification,
  savePendingSignupVerification,
} from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { nav } from "@/test/navigation";
import { renderWithQuery, resetAppState } from "@/test/utils";

type User = ReturnType<typeof userEvent.setup>;

const signupReply = {
  success: true,
  message: "Sign up successful! Proceed to payment",
  user_id: "LTS-2",
  access_key: "new-key",
  subscription_id: "SUB-1",
  transaction_id: "TRX-9",
  amount: "1000.00",
  email: "ngozi@example.com",
  paystack_payment_key: "pk_test_x",
  referral_type: "code",
  referral_id: "",
};

const session = {
  success: true,
  message: "Registration successful!",
  user: [
    {
      user_id: "LTS-2",
      access_key: "live-key-1",
      fullname: "Ngozi Eze",
      email: "ngozi@example.com",
      mobile_no: "08012345678",
      wallet_balance: "0.00",
      status_name: "ACTIVE",
    },
  ],
  subscription: [
    {
      department_id: "DPT002",
      department_name: "JUNIOR",
      class_id: "CLS010",
      class_name: "JSS 2",
      subscription_start_date: "2026-10-21 10:00:00",
      subscription_end_date: "2026-11-20 10:00:00",
    },
  ],
};

/** Answers each live endpoint with a canned reply; anything else fails the test loudly. */
const answer = (overrides: Record<string, unknown> = {}) => {
  const replies: Record<string, unknown> = {
    "/site/departments/fetch-department": {
      success: true,
      message: "",
      data: [
        { department_id: "DPT001", department_name: "BASIC" },
        { department_id: "DPT002", department_name: "JUNIOR" },
      ],
    },
    "/setups/payment-method": {
      success: true,
      message: "",
      data: [
        { payment_method_id: "DO", payment_method_name: "DIRECT ONLINE PAYMENT" },
        { payment_method_id: "WAL", payment_method_name: "WALLET PAYMENT" },
      ],
    },
    "/user/auth/signup": signupReply,
    "/user/auth/signup-complete": session,
    "/user/auth/signup-cancelled": { success: true, message: "" },
    ...overrides,
  };
  vi.mocked(liveCall).mockImplementation((async (path: string, params?: Record<string, unknown>) => {
    if (path === "/site/department-class-subject/fetch-class-by-department") {
      const classes: Record<string, unknown[]> = {
        DPT001: [{ class_id: "CLS001", class_name: "BASIC 1" }],
        DPT002: [{ class_id: "CLS010", class_name: "JSS 2" }],
      };
      return { success: true, message: "", data: classes[String(params?.department_id)] ?? [] };
    }
    const reply = replies[path];
    if (!reply) throw new Error(`unexpected call to ${path}`);
    if (reply instanceof Error) throw reply;
    return reply;
  }) as never);
};

const fillSignup = async (user: User) => {
  await user.type(await screen.findByLabelText("Full Name"), "Ngozi Eze");
  await user.type(screen.getByLabelText("Email Address"), "ngozi@example.com");
  await user.type(screen.getByLabelText("Mobile Number"), "0801 234 5678");
  await screen.findByRole("option", { name: "JUNIOR" });
  await user.selectOptions(screen.getByLabelText("Department"), "DPT002");
  await screen.findByRole("option", { name: "JSS 2" });
  await user.selectOptions(screen.getByLabelText("Select Class"), "CLS010");
  await user.type(screen.getByLabelText("Create Password"), "secret12");
  await user.type(screen.getByLabelText("Confirm Password"), "secret12");
};

describe("sign up against the live API", () => {
  beforeEach(() => {
    resetAppState();
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    vi.mocked(liveCall).mockReset();
    answer();
  });

  it("lists classes for the chosen department, then goes straight to payment with no emailed code", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);

    // Classes belong to the department: switching it clears the class and loads that department's own.
    await user.selectOptions(screen.getByLabelText("Department"), "DPT001");
    await screen.findByRole("option", { name: "BASIC 1" });
    expect(screen.queryByRole("option", { name: "JSS 2" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Select Class")).toHaveValue("");
    await user.selectOptions(screen.getByLabelText("Department"), "DPT002");
    await screen.findByRole("option", { name: "JSS 2" });
    await user.selectOptions(screen.getByLabelText("Select Class"), "CLS010");

    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    const dialog = await screen.findByRole("dialog", { name: /confirm your learning plan/i });
    expect(within(dialog).getByText("JUNIOR")).toBeInTheDocument();
    expect(within(dialog).getByText("JSS 2")).toBeInTheDocument();
    // Only online payment is possible for a brand-new account, so it is already chosen.
    expect(within(dialog).getByLabelText(/payment method/i)).toHaveValue("DO");
    expect(within(dialog).queryByRole("option", { name: /wallet/i })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /proceed to payment/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/sign-up/complete-registration"));
    expect(liveCall).toHaveBeenCalledWith("/user/auth/signup", {
      fullname: "Ngozi Eze",
      email: "ngozi@example.com",
      mobile_no: "0801 234 5678",
      department_id: "DPT002",
      class_id: "CLS010",
      create_password: "secret12",
      confirm_password: "secret12",
      referral_type: "code",
      referral_id: "",
    });
    expect(readPendingSignupVerification()).toMatchObject({
      userId: "LTS-2",
      paymentProceedData: { transactionId: "TRX-9", accessKey: "new-key", paystackPaymentKey: "pk_test_x" },
    });
  });

  it("sends a typed referral code", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);
    await user.type(screen.getByLabelText("Referral Code (Optional)"), "AGENT-7");
    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    await user.click(await screen.findByRole("button", { name: /proceed to payment/i }));

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(liveCall).toHaveBeenCalledWith("/user/auth/signup", expect.objectContaining({ referral_type: "code", referral_id: "AGENT-7" }));
  });

  it("credits a ?ref= link instead of asking for a code", async () => {
    nav.search = "?ref=LTS-9";
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);
    expect(screen.queryByLabelText("Referral Code (Optional)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    await user.click(await screen.findByRole("button", { name: /proceed to payment/i }));

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(liveCall).toHaveBeenCalledWith("/user/auth/signup", expect.objectContaining({ referral_type: "link", referral_id: "LTS-9" }));
  });

  it("shows the API's reason when sign-up is refused, and stays put", async () => {
    answer({ "/user/auth/signup": Object.assign(new Error("Email already registered. Login instead."), { status: 400 }) });
    const showToast = vi.spyOn(toast, "showToast");
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);
    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    await user.click(await screen.findByRole("button", { name: /proceed to payment/i }));

    await waitFor(() => expect(vi.mocked(liveCall).mock.calls.some(([path]) => path === "/user/auth/signup")).toBe(true));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error", message: "Email already registered. Login instead." }),
      ),
    );
    expect(nav.push).not.toHaveBeenCalled();
    expect(readPendingSignupVerification()).toBeNull();
  });
});

describe("finishing registration against the live API", () => {
  beforeEach(() => {
    resetAppState();
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    vi.mocked(liveCall).mockReset();
    vi.mocked(initializePaystackPayment).mockReset();
    vi.mocked(loadPaystackScript).mockResolvedValue(undefined);
    answer();

    const payload = mapSignupPayload(
      { fullName: "Ngozi Eze", emailAddress: "ngozi@example.com", phoneNumber: "08012345678", department: "DPT002", exam: "CLS010", password: "secret12", confirmPassword: "secret12" },
      { paymentMethodId: "DO" },
    );
    savePendingSignupVerification(getSignupVerificationData(signupReply, payload));
  });

  const openCheckout = async (user: User) => {
    await user.click(await screen.findByRole("button", { name: /^proceed$/i }));
    const payment = await screen.findByRole("dialog", { name: /complete registration payment/i });
    await user.click(within(payment).getByRole("button", { name: /^pay ₦1,000\.00$/i }));
  };

  it("has nothing left to choose: no payment method or referral field", async () => {
    renderWithQuery(<CompleteRegistration />);
    expect(await screen.findByRole("button", { name: /^proceed$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Payment Method")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/referral code/i)).not.toBeInTheDocument();
    expect(screen.getByText(/₦1,000\.00/)).toBeInTheDocument();
    expect(liveCall).not.toHaveBeenCalledWith("/setups/payment-method", expect.anything());
  });

  it("charges the API's transaction, confirms it with the new account's key and signs the student in", async () => {
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onSuccess("paystack-ref"));
    const user = userEvent.setup();
    renderWithQuery(<CompleteRegistration />);
    await openCheckout(user);

    expect(initializePaystackPayment).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: "pk_test_x", reference: "TRX-9", amount: 100000, email: "ngozi@example.com" }),
    );
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    expect(liveCall).toHaveBeenCalledWith(
      "/user/auth/signup-complete",
      expect.objectContaining({ user_id: "LTS-2", transaction_id: "TRX-9", subscription_id: "SUB-1", paystack_payment_key: "pk_test_x" }),
      { token: "new-key" },
    );

    const { token, user: student, account, userEnrollment } = useAuthStore.getState();
    expect(token).toBe("live-key-1");
    expect(student).toMatchObject({ email: "ngozi@example.com", first_name: "Ngozi" });
    expect(account?.subscription?.endDate).toBe("2026-11-20 10:00:00");
    expect(userEnrollment).toMatchObject({ departmentId: "DPT002", examId: "CLS010", examAbbreviation: "JSS 2", status: "active" });
    expect(readPendingSignupVerification()).toBeNull();
  });

  it("tells the API when checkout is closed unpaid, and keeps the registration for another try", async () => {
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onClose());
    const user = userEvent.setup();
    renderWithQuery(<CompleteRegistration />);
    await openCheckout(user);

    expect(await screen.findByRole("status")).toHaveTextContent(/payment was cancelled and no money was taken/i);
    expect(liveCall).toHaveBeenCalledWith("/user/auth/signup-cancelled", {}, { token: "new-key" });
    expect(useAuthStore.getState().token).toBeNull();
    expect(readPendingSignupVerification()).not.toBeNull();
    expect(screen.getByRole("button", { name: /try payment again/i })).toBeEnabled();
  });

  it("never reports success when the API cannot confirm the payment, and offers a retry", async () => {
    answer({ "/user/auth/signup-complete": new Error("Payment could not be verified yet.") });
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onSuccess("paystack-ref"));
    const user = userEvent.setup();
    renderWithQuery(<CompleteRegistration />);
    await openCheckout(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/payment could not be verified yet/i);
    expect(nav.push).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.getByRole("button", { name: /retry activation/i })).toBeInTheDocument();
  });
});
