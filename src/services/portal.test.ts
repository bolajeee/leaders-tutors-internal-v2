import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn() } }));

import { apiClient } from "@/lib/api-client";
import { fetchDashboardSummary, fetchUserSubscription, mapSubscription } from "./portal";
import { resetAppState, signInAs } from "@/test/utils";
import { useDemoStore } from "./mock/demoStore";
import { useAuthStore } from "@/store/authStore";

describe("subscription status mapping", () => {
  beforeEach(resetAppState);

  it("maps an active subscription from the API envelope body", () => {
    const subscription = mapSubscription({
      subscriptionId: 77,
      statusId: 1,
      daysLeft: 12,
      subscriptionStartDate: "2026-01-01",
      subscriptionEndDate: "2026-02-01",
      statusData: { statusId: 1, statusName: "ACTIVE" },
    });
    expect(subscription).toMatchObject({
      isSubscriptionActive: true,
      daysLeft: 12,
      subscriptionId: "77",
      subscriptionExpiresAt: "2026-02-01",
      lastPaymentDate: "2026-01-01",
    });
  });

  it("treats an active status with no days left as expired", () => {
    expect(mapSubscription({ statusData: { statusName: "ACTIVE" }, daysLeft: 0 }).isSubscriptionActive).toBe(false);
  });

  it("treats a non-active status as expired", () => {
    expect(mapSubscription({ statusData: { statusId: 2, statusName: "EXPIRED" }, daysLeft: 9 }).isSubscriptionActive).toBe(false);
  });

  it("falls back to the stored enrollment for class details", () => {
    useAuthStore.setState({
      userEnrollment: { departmentId: "3", departmentName: "Junior", examId: "9", examAbbreviation: "JSS 2" },
    });
    expect(mapSubscription({ statusId: 1, daysLeft: 3 })).toMatchObject({
      departmentId: "3",
      departmentName: "Junior",
      examId: "9",
      examAbbreviation: "JSS 2",
    });
  });

  it("tolerates a malformed body", () => {
    expect(mapSubscription(null).isSubscriptionActive).toBe(false);
    expect(mapSubscription("oops").walletBalance).toBe(0);
  });
});

describe("subscription status (mock mode)", () => {
  beforeEach(resetAppState);

  it("is inactive without a session", async () => {
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: false });
  });

  it("reports an active demo student with days left and a wallet balance", async () => {
    signInAs("active");
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: true, daysLeft: 30, walletBalance: 9000 });
  });

  it("reports an expired demo student", async () => {
    signInAs("expired");
    const summary = await fetchDashboardSummary();
    expect(summary).toMatchObject({ subscriptionStatus: "expired", subscriptionExpiresIn: 0 });
  });

  it("reflects a renewal made in the demo store", async () => {
    signInAs("expired");
    useDemoStore.getState().renew();
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: true });
  });
});

describe("subscription status (api mode)", () => {
  beforeEach(() => {
    resetAppState();
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    useAuthStore.setState({ token: "real-token" });
    vi.mocked(apiClient.get).mockReset();
  });

  it("treats a missing subscription (404) as not subscribed", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ status: 404, message: "Not found" });
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: false });
  });

  it("surfaces server errors so the UI can offer a retry instead of guessing", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ status: 500, message: "Server error" });
    await expect(fetchUserSubscription()).rejects.toMatchObject({ status: 500 });
  });
});
