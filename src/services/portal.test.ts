import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDashboardSummary, fetchUserSubscription, subscriptionFromAccount } from "./portal";
import { resetAppState, signInAs } from "@/test/utils";
import { useDemoStore } from "./mock/demoStore";
import { useAuthStore } from "@/store/authStore";
import type { AccountSnapshot } from "@/types/portal";

const NOW = new Date("2026-10-21T12:00:00");

const plan = (overrides: Partial<NonNullable<AccountSnapshot["subscription"]>> = {}) => ({
  subscriptionId: "SUB-7",
  departmentId: "DPT002",
  departmentName: "JUNIOR",
  classId: "CLS010",
  className: "JSS 2",
  startDate: "2026-10-01 10:00:00",
  endDate: "2026-10-31 10:00:00",
  ...overrides,
});

describe("subscription from the live account snapshot", () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW, toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  it("is active, with days left and the class, while the plan end date is ahead", () => {
    const subscription = subscriptionFromAccount({ walletBalance: 2500, statusName: "ACTIVE", subscription: plan() });
    expect(subscription).toMatchObject({
      isSubscriptionActive: true,
      daysLeft: 10,
      walletBalance: 2500,
      departmentName: "JUNIOR",
      examId: "CLS010",
      examAbbreviation: "JSS 2",
      subscriptionId: "SUB-7",
      lastPaymentDate: "2026-10-01 10:00:00",
      statusName: "ACTIVE",
    });
  });

  it("expires on its own once the end date passes, without asking the API", () => {
    const subscription = subscriptionFromAccount({
      walletBalance: 0,
      statusName: "ACTIVE",
      subscription: plan({ endDate: "2026-10-20 10:00:00" }),
    });
    expect(subscription).toMatchObject({ isSubscriptionActive: false, daysLeft: 0, statusName: "EXPIRED" });
  });

  it("is inactive with no plan or an unreadable date", () => {
    expect(subscriptionFromAccount(null).isSubscriptionActive).toBe(false);
    expect(subscriptionFromAccount({ walletBalance: 5, statusName: "ACTIVE" })).toMatchObject({
      isSubscriptionActive: false,
      walletBalance: 5,
    });
    expect(subscriptionFromAccount({ walletBalance: 0, statusName: "", subscription: plan({ endDate: "soon" }) }).isSubscriptionActive).toBe(false);
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
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("is inactive when signed in but no account details were ever received", async () => {
    useAuthStore.setState({ token: "real-token", account: null });
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: false });
  });

  it("reads the plan and wallet the API last reported, and remembers the enrollment", async () => {
    useAuthStore.setState({
      token: "real-token",
      account: { walletBalance: 1200, statusName: "ACTIVE", subscription: plan() },
    });
    await expect(fetchUserSubscription()).resolves.toMatchObject({
      isSubscriptionActive: true,
      walletBalance: 1200,
      examAbbreviation: "JSS 2",
    });
    expect(useAuthStore.getState().userEnrollment).toMatchObject({ departmentId: "DPT002", examId: "CLS010", status: "active" });
  });

  it("follows a newer snapshot, such as the one a renewal brings back", async () => {
    useAuthStore.setState({
      token: "real-token",
      account: { walletBalance: 0, statusName: "ACTIVE", subscription: plan({ endDate: "2026-10-20 10:00:00" }) },
    });
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: false });
    useAuthStore.getState().setAccount({ walletBalance: 0, statusName: "ACTIVE", subscription: plan({ endDate: "2026-11-20 10:00:00" }) });
    await expect(fetchUserSubscription()).resolves.toMatchObject({ isSubscriptionActive: true, daysLeft: 30 });
  });
});
