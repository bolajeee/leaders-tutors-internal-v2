import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUp from "./SignUp";
import { OtpVerification } from "./OtpVerification";
import { CompleteRegistration } from "./CompleteRegistration";
import * as authService from "@/services/auth";
import {
  getSignupVerificationData,
  mapSignupPayload,
  readPendingSignupVerification,
  savePendingSignupVerification,
  signupUser,
} from "@/services/auth";
import * as toast from "@/components/toast";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore, daysUntil } from "@/services/mock/demoStore";
import { MOCK_OTP, MOCK_TAKEN_EMAIL } from "@/services/mock/directory";
import { nav } from "@/test/navigation";
import { renderWithCheckout, renderWithQuery, resetAppState } from "@/test/utils";

type User = ReturnType<typeof userEvent.setup>;

const fillSignup = async (user: User, email = "ngozi@example.com") => {
  await user.type(await screen.findByLabelText("Full Name"), "Ngozi Eze");
  await user.type(screen.getByLabelText("Email Address"), email);
  await user.type(screen.getByLabelText("Mobile Number"), "0801 234 5678");
  await user.selectOptions(await screen.findByLabelText("Department"), "junior");
  await user.selectOptions(screen.getByLabelText("Select Class"), "jss-2");
  await user.type(screen.getByLabelText("Create Password"), "secret12");
  await user.type(screen.getByLabelText("Confirm Password"), "secret12");
};

describe("sign up", () => {
  beforeEach(resetAppState);

  it("explains every missing or invalid field", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await user.type(await screen.findByLabelText("Email Address"), "nope");
    await user.type(screen.getByLabelText("Mobile Number"), "12");
    await user.click(screen.getByRole("button", { name: /sign-up/i }));

    expect(await screen.findByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText(/enter a valid mobile number/i)).toBeInTheDocument();
    expect(screen.getByText("Select a department")).toBeInTheDocument();
    expect(screen.getByText("Select your class")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows password mismatch", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);
    await user.clear(screen.getByLabelText("Confirm Password"));
    await user.type(screen.getByLabelText("Confirm Password"), "different1");
    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });

  it("confirms the plan, then requires a payment method before verification", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUp />);
    await fillSignup(user);
    await user.click(screen.getByRole("button", { name: /sign-up/i }));

    const dialog = await screen.findByRole("dialog", { name: /confirm your learning plan/i });
    expect(within(dialog).getByText("Junior Secondary")).toBeInTheDocument();
    expect(within(dialog).getByText("JSS 2")).toBeInTheDocument();
    expect(within(dialog).getByText("₦1,000.00")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /continue to verification/i }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/select a payment method/i);
    expect(nav.push).not.toHaveBeenCalled();

    await user.selectOptions(within(dialog).getByLabelText(/payment method/i), "CC");
    await user.click(within(dialog).getByRole("button", { name: /continue to verification/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/sign-up/verify-account"));
    expect(readPendingSignupVerification()).toMatchObject({
      emailAddress: "ngozi@example.com",
      signupPayload: { fullName: "Ngozi Eze", departmentId: "junior", examId: "jss-2", paymentMethodId: "CC" },
    });
  });

  it("reports an email that is already registered", async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(toast, "showToast");
    renderWithQuery(<SignUp />);
    await fillSignup(user, MOCK_TAKEN_EMAIL);
    await user.click(screen.getByRole("button", { name: /sign-up/i }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText(/payment method/i), "CC");
    await user.click(within(dialog).getByRole("button", { name: /continue to verification/i }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(expect.objectContaining({ variant: "error", message: expect.stringMatching(/already exists/i) })),
    );
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("does not invent legal links that lead nowhere", async () => {
    renderWithQuery(<SignUp />);
    await screen.findByLabelText("Full Name");
    expect(screen.queryByText(/privacy policy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/terms of service/i)).not.toBeInTheDocument();
  });
});

const seedPendingSignup = async () => {
  const payload = mapSignupPayload(
    { fullName: "Ngozi Eze", emailAddress: "ngozi@example.com", phoneNumber: "08012345678", department: "junior", exam: "jss-2", password: "secret12", confirmPassword: "secret12" },
    { paymentMethodId: "CC" },
  );
  savePendingSignupVerification(getSignupVerificationData(await signupUser(payload), payload));
};

describe("email verification", () => {
  beforeEach(async () => {
    resetAppState();
    await seedPendingSignup();
  });

  it("shows where the code was sent and continues to payment on the right code", async () => {
    const user = userEvent.setup();
    renderWithQuery(<OtpVerification />);
    expect(await screen.findByText("ngozi@example.com")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Digit 1 of 6"));
    await user.paste(MOCK_OTP);
    await user.click(screen.getByRole("button", { name: /proceed/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/sign-up/complete-registration"));
  });

  it("asks for all six digits", async () => {
    const user = userEvent.setup();
    renderWithQuery(<OtpVerification />);
    await user.click(await screen.findByLabelText("Digit 1 of 6"));
    await user.keyboard("123");
    await user.click(screen.getByRole("button", { name: /proceed/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/six-digit code/i);
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("explains a wrong code and lets the student try again", async () => {
    const user = userEvent.setup();
    renderWithQuery(<OtpVerification />);
    await user.click(await screen.findByLabelText("Digit 1 of 6"));
    await user.paste("999999");
    await user.click(screen.getByRole("button", { name: /proceed/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/code isn't correct/i);
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("only offers a resend after the countdown", async () => {
    renderWithQuery(<OtpVerification />);
    expect(await screen.findByText(/request a new code in 00:30/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();
  });
});

describe("complete registration (payment)", () => {
  beforeEach(async () => {
    resetAppState();
    await seedPendingSignup();
  });

  const chooseAndPay = async (user: User) => {
    await user.selectOptions(await screen.findByLabelText("Payment Method"), "CC");
    await user.click(screen.getByRole("button", { name: /^proceed$/i }));
    const payment = await screen.findByRole("dialog", { name: /complete registration payment/i });
    await user.click(within(payment).getByRole("button", { name: /^pay ₦1,000\.00$/i }));
    return screen.findByRole("dialog", { name: /paystack checkout/i });
  };

  it("requires a payment method", async () => {
    const user = userEvent.setup();
    renderWithCheckout(<CompleteRegistration />);
    await user.click(await screen.findByRole("button", { name: /^proceed$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/select a payment method/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("activates the account, signs the student in and opens the dashboard after a successful payment", async () => {
    const user = userEvent.setup();
    renderWithCheckout(<CompleteRegistration />);
    const checkout = await chooseAndPay(user);
    await user.click(within(checkout).getByRole("button", { name: /^pay ₦1,000$/i }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    const { token, user: student, userEnrollment } = useAuthStore.getState();
    expect(token).toMatch(/^mock-session-/);
    expect(student).toMatchObject({ email: "ngozi@example.com", first_name: "Ngozi" });
    expect(userEnrollment).toMatchObject({ examId: "jss-2", status: "active" });
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(30);
    expect(readPendingSignupVerification()).toBeNull(); // the stored password is discarded
  });

  it("explains a cancelled payment, keeps the registration, and allows trying again", async () => {
    const user = userEvent.setup();
    renderWithCheckout(<CompleteRegistration />);
    const checkout = await chooseAndPay(user);
    await user.click(within(checkout).getByRole("button", { name: /^cancel payment$/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/payment was cancelled and no money was taken/i);
    expect(useAuthStore.getState().token).toBeNull();
    expect(nav.push).not.toHaveBeenCalled();
    expect(readPendingSignupVerification()).not.toBeNull();
    expect(screen.getByRole("button", { name: /try payment again/i })).toBeEnabled();
  });

  it("holds a pending payment until it can be checked, then activates", async () => {
    const user = userEvent.setup();
    renderWithCheckout(<CompleteRegistration />);
    const checkout = await chooseAndPay(user);
    await user.click(within(checkout).getByRole("button", { name: /simulate pending confirmation/i }));

    expect(await screen.findByText(/your payment is being confirmed/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
    await user.click(screen.getByRole("button", { name: /check payment status/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    expect(useAuthStore.getState().token).not.toBeNull();
  });

  it("never reports success when activation fails, and lets the student retry without paying again", async () => {
    const user = userEvent.setup();
    const showToast = vi.spyOn(toast, "showToast");
    const activation = vi
      .spyOn(authService, "completeSignupSuccess")
      .mockRejectedValueOnce(new Error("Payment could not be verified yet."));
    renderWithCheckout(<CompleteRegistration />);
    const checkout = await chooseAndPay(user);
    await user.click(within(checkout).getByRole("button", { name: /^pay ₦1,000$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/payment could not be verified yet/i);
    expect(alert).toHaveTextContent(/won't be charged again/i);
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ variant: "success" }));
    expect(nav.push).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();

    activation.mockRestore();
    await user.click(screen.getByRole("button", { name: /retry activation/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("sends the student back to sign up when the signup session is gone", async () => {
    window.sessionStorage.clear();
    renderWithCheckout(<CompleteRegistration />);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/sign-up"));
  });
});
