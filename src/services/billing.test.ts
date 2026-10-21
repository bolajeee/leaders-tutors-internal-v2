import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));
vi.mock("@/services/paystack", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/paystack")>()),
  loadPaystackScript: vi.fn().mockResolvedValue(undefined),
  initializePaystackPayment: vi.fn(),
}));

import { liveCall } from "@/lib/live-api";
import { initializePaystackPayment, loadPaystackScript } from "@/services/paystack";
import { useAuthStore } from "@/store/authStore";
import { renewSubscription } from "./billing";
import { getActiveMockCheckout, settleMockCheckout } from "./mock/checkout";
import { useDemoStore, daysUntil } from "./mock/demoStore";
import { FeatureUnavailableError, PaymentCancelledError } from "@/lib/errors";

const EMAIL = "expired.student@leaderstutors.com";

describe("subscription renewal (mock mode)", () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    useDemoStore.getState().seed(EMAIL, "expired");
  });
  afterEach(() => settleMockCheckout("cancelled"));

  const waitForCheckout = async () => {
    await vi.waitFor(() => expect(getActiveMockCheckout()).not.toBeNull());
  };

  it("extends access and records a successful payment when the checkout is paid", async () => {
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(0);
    const renewal = renewSubscription(EMAIL);
    await waitForCheckout();
    expect(getActiveMockCheckout()).toMatchObject({ email: EMAIL, amount: 1000 });
    settleMockCheckout("paid");

    await expect(renewal).resolves.toMatchObject({ status: "success", daysAdded: 30 });
    const state = useDemoStore.getState();
    expect(daysUntil(state.subscriptionEndsAt)).toBeGreaterThanOrEqual(29);
    expect(state.transactions[0]).toMatchObject({ type: "subscription", status: "success" });
  });

  it("leaves access untouched and records a cancelled payment when the checkout is cancelled", async () => {
    const renewal = renewSubscription(EMAIL);
    await waitForCheckout();
    settleMockCheckout("cancelled");

    await expect(renewal).rejects.toBeInstanceOf(PaymentCancelledError);
    const state = useDemoStore.getState();
    expect(daysUntil(state.subscriptionEndsAt)).toBe(0);
    expect(state.transactions[0]).toMatchObject({ status: "cancelled" });
  });

  it("reports a pending payment without extending access", async () => {
    const renewal = renewSubscription(EMAIL);
    await waitForCheckout();
    settleMockCheckout("pending");

    await expect(renewal).resolves.toMatchObject({ status: "pending", daysAdded: 0 });
    const state = useDemoStore.getState();
    expect(daysUntil(state.subscriptionEndsAt)).toBe(0);
    expect(state.transactions[0]).toMatchObject({ status: "pending" });
  });

  it("adds time on top of the remaining days when renewing early", async () => {
    useDemoStore.getState().seed("student@leaderstutors.com", "active");
    const before = daysUntil(useDemoStore.getState().subscriptionEndsAt);
    const renewal = renewSubscription("student@leaderstutors.com");
    await waitForCheckout();
    settleMockCheckout("paid");
    await renewal;
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBeGreaterThanOrEqual(before + 29);
  });
});

describe("subscription renewal (api mode)", () => {
  const renewalOrder = {
    success: true,
    message: "",
    subscription_id: "SUB-2",
    transaction_id: "TRX-2",
    amount: "1000.00",
    email: EMAIL,
    paystack_payment_key: "pk_test_live",
  };
  const renewedSession = {
    success: true,
    message: "",
    user: [{ user_id: "u", access_key: "k", wallet_balance: "0", status_name: "ACTIVE" }],
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

  const answer = (replies: Record<string, unknown>) =>
    vi.mocked(liveCall).mockImplementation(async (path: string) => {
      const reply = replies[path];
      if (reply instanceof Error) throw reply;
      if (!reply) throw new Error(`unexpected call to ${path}`);
      return reply as never;
    });

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://leaderstutors.com/api/dev");
    vi.mocked(liveCall).mockReset();
    vi.mocked(initializePaystackPayment).mockReset();
    vi.mocked(loadPaystackScript).mockResolvedValue(undefined);
    useAuthStore.setState({
      token: "real-token",
      user: { email: EMAIL } as never,
      account: {
        walletBalance: 0,
        statusName: "ACTIVE",
        subscription: {
          departmentId: "DPT002",
          departmentName: "JUNIOR",
          classId: "CLS010",
          className: "JSS 2",
          startDate: "2026-09-01 10:00:00",
          endDate: "2026-09-30 10:00:00",
        },
      },
    });
  });

  it("refuses to renew, without calling the API, when the API is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    await expect(renewSubscription(EMAIL)).rejects.toBeInstanceOf(FeatureUnavailableError);
    expect(liveCall).not.toHaveBeenCalled();
  });

  it("logs the renewal, charges that transaction on Paystack, then confirms it and updates the plan", async () => {
    answer({
      "/user/subscription/renew-subscription": renewalOrder,
      "/user/subscription/subscription-success": renewedSession,
    });
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onSuccess("paystack-ref"));

    const result = await renewSubscription(EMAIL);

    expect(result).toMatchObject({ transactionId: "TRX-2", status: "success" });
    expect(result.daysAdded).toBeGreaterThanOrEqual(29);
    expect(liveCall).toHaveBeenCalledWith("/user/subscription/renew-subscription", {
      department_id: "DPT002",
      class_id: "CLS010",
      payment_method_id: "DO",
    });
    expect(initializePaystackPayment).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: "pk_test_live", reference: "TRX-2", amount: 100000, email: EMAIL }),
    );
    expect(liveCall).toHaveBeenCalledWith("/user/subscription/subscription-success", {
      transaction_id: "TRX-2",
      subscription_id: "SUB-2",
      amount: 1000,
      payment_key: "pk_test_live",
    });
    expect(useAuthStore.getState().account?.subscription?.endDate).toBe("2026-11-20 10:00:00");
  });

  it("tells the API when checkout is closed unpaid and reports a cancellation", async () => {
    answer({
      "/user/subscription/renew-subscription": renewalOrder,
      "/user/subscription/subscription-cancelled": { success: true, message: "" },
    });
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onClose());

    await expect(renewSubscription(EMAIL)).rejects.toBeInstanceOf(PaymentCancelledError);
    expect(liveCall).toHaveBeenCalledWith("/user/subscription/subscription-cancelled", {
      transaction_id: "TRX-2",
      subscription_id: "SUB-2",
    });
    expect(useAuthStore.getState().account?.subscription?.endDate).toBe("2026-09-30 10:00:00");
  });

  it("does not claim success when the API cannot confirm a payment that was taken", async () => {
    answer({
      "/user/subscription/renew-subscription": renewalOrder,
      "/user/subscription/subscription-success": new Error("Network Error"),
    });
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onSuccess("paystack-ref"));
    await expect(renewSubscription(EMAIL)).resolves.toMatchObject({ transactionId: "TRX-2", status: "pending", daysAdded: 0 });
  });

  it("finds the class by name when the API sent no ids", async () => {
    useAuthStore.setState({
      account: {
        walletBalance: 0,
        statusName: "ACTIVE",
        subscription: { departmentId: "", departmentName: "Junior", classId: "", className: "jss 2", startDate: "", endDate: "" },
      },
    });
    answer({
      "/site/departments/fetch-department": { success: true, message: "", data: [{ department_id: "DPT002", department_name: "JUNIOR" }] },
      "/site/department-class-subject/fetch-class-by-department": { success: true, message: "", data: [{ class_id: "CLS010", class_name: "JSS 2" }] },
      "/user/subscription/renew-subscription": renewalOrder,
      "/user/subscription/subscription-success": renewedSession,
    });
    vi.mocked(initializePaystackPayment).mockImplementation((config) => config.onSuccess("paystack-ref"));

    await renewSubscription(EMAIL);
    expect(liveCall).toHaveBeenCalledWith("/user/subscription/renew-subscription", {
      department_id: "DPT002",
      class_id: "CLS010",
      payment_method_id: "DO",
    });
  });
});
