import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ apiClient: { post: vi.fn() } }));

import { apiClient } from "@/lib/api-client";
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
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.mocked(apiClient.post).mockReset();
  });

  it("refuses to renew, without calling the API, when no endpoint is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH", "");
    await expect(renewSubscription(EMAIL)).rejects.toBeInstanceOf(FeatureUnavailableError);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("posts to the configured endpoint and reports what the API returned", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH", "/user/payment/renew-subscription");
    vi.mocked(apiClient.post).mockResolvedValue({ transactionId: "T1", status: "success", daysAdded: 30 });
    await expect(renewSubscription(EMAIL)).resolves.toEqual({ transactionId: "T1", status: "success", daysAdded: 30 });
    expect(apiClient.post).toHaveBeenCalledWith("/user/payment/renew-subscription");
  });

  it("does not report success unless the API says the payment succeeded", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH", "/user/payment/renew-subscription");
    vi.mocked(apiClient.post).mockResolvedValue({ transactionId: "T2" });
    await expect(renewSubscription(EMAIL)).resolves.toMatchObject({ status: "pending" });
  });
});
