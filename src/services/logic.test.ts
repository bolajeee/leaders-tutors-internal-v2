import { describe, expect, it } from "vitest";
import { canOpenLesson, resolveAccess } from "./access";
import { buildNotifications } from "./notifications";
import { inactiveSubscription } from "./portal";
import { buildReceipt, buildTransactionsCsv, hasReceipt } from "@/utils/receipt";
import { SignupSchema, validateNewPassword } from "@/types/auth/schema";
import type { UserSubscription } from "@/types/portal";
import type { WalletTransaction } from "@/types/payment";

const subscription = (overrides: Partial<UserSubscription> = {}): UserSubscription => ({
  ...inactiveSubscription(),
  isSubscriptionActive: true,
  daysLeft: 20,
  ...overrides,
});

const transaction = (overrides: Partial<WalletTransaction> = {}): WalletTransaction => ({
  id: "T-1",
  amount: 1000,
  currency: "₦",
  status: "success",
  type: "subscription",
  createdAt: "2026-03-05T10:00:00.000Z",
  description: "Student plan renewal",
  ...overrides,
});

describe("subscription gating", () => {
  it("opens lessons only for an active subscription", () => {
    expect(canOpenLesson(resolveAccess({ isLoading: false, isError: false, subscription: subscription() }))).toBe(true);
    expect(canOpenLesson(resolveAccess({ isLoading: false, isError: false, subscription: subscription({ isSubscriptionActive: false }) }))).toBe(false);
  });

  it("keeps lessons locked while loading and when the status could not be determined", () => {
    expect(resolveAccess({ isLoading: true, isError: false })).toBe("loading");
    expect(resolveAccess({ isLoading: false, isError: true })).toBe("error");
    expect(canOpenLesson("loading")).toBe(false);
    expect(canOpenLesson("error")).toBe(false);
  });

  it("prefers known subscription data over a later refetch error", () => {
    expect(resolveAccess({ isLoading: false, isError: true, subscription: subscription() })).toBe("active");
  });
});

describe("notifications", () => {
  it("warns about an expired subscription", () => {
    expect(buildNotifications(subscription({ isSubscriptionActive: false, daysLeft: 0 }))).toMatchObject([
      { id: "subscription-expired", tone: "danger", href: "/subscriptions" },
    ]);
  });

  it("warns when access is about to end, with singular and plural wording", () => {
    expect(buildNotifications(subscription({ daysLeft: 1 }))[0].title).toBe("Access ends in 1 day");
    expect(buildNotifications(subscription({ daysLeft: 5 }))[0].title).toBe("Access ends in 5 days");
  });

  it("is empty for a healthy account", () => {
    expect(buildNotifications(subscription({ daysLeft: 20 }), [transaction()])).toEqual([]);
  });

  it("flags payments awaiting confirmation", () => {
    expect(buildNotifications(subscription(), [transaction({ id: "P-9", status: "pending" })])).toMatchObject([
      { id: "payment-pending-P-9", tone: "info", href: "/transactions" },
    ]);
  });
});

describe("receipts and exports", () => {
  it("only completed payments have a receipt", () => {
    expect(hasReceipt(transaction())).toBe(true);
    expect(hasReceipt(transaction({ status: "pending" }))).toBe(false);
    expect(hasReceipt(transaction({ status: "cancelled" }))).toBe(false);
  });

  it("builds a readable receipt", () => {
    const receipt = buildReceipt(transaction(), "Ada Obi");
    expect(receipt).toContain("Student:     Ada Obi");
    expect(receipt).toContain("Reference:   T-1");
    expect(receipt).toContain("Amount:      ₦1,000");
  });

  it("exports CSV with quoting and spreadsheet-formula protection", () => {
    const csv = buildTransactionsCsv([
      transaction({ id: "T-2", description: 'Pay, "now"' }),
      transaction({ id: "=HYPERLINK(1)", description: "x" }),
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Reference,Purpose,Type,Amount,Currency,Status,Date");
    expect(lines[1]).toContain('"Pay, ""now"""');
    expect(lines[2].startsWith("'=HYPERLINK(1)")).toBe(true);
  });
});

describe("form validation", () => {
  const valid = {
    fullName: "Ada Obi",
    emailAddress: "ada@example.com",
    phoneNumber: "0801 234 5678",
    department: "basic",
    exam: "basic-5",
    password: "secret12",
    confirmPassword: "secret12",
  };
  const issues = (input: object) => {
    const result = SignupSchema.safeParse({ ...valid, ...input });
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it("accepts a complete signup", () => {
    expect(issues({})).toEqual([]);
  });

  it("explains each problem in plain language", () => {
    expect(issues({ fullName: "  " })).toContain("Full name is required");
    expect(issues({ emailAddress: "not-an-email" })).toContain("Enter a valid email address");
    expect(issues({ phoneNumber: "12ab" })).toContain("Enter a valid mobile number, for example 0801 234 5678");
    expect(issues({ department: "" })).toContain("Select a department");
    expect(issues({ exam: "" })).toContain("Select your class");
    expect(issues({ confirmPassword: "different1" })).toContain("Passwords do not match");
    expect(issues({ password: "123", confirmPassword: "123" })).toContain("Password must be at least 6 characters long");
  });

  it("accepts international and spaced phone formats", () => {
    expect(issues({ phoneNumber: "+234 708 701 3213" })).toEqual([]);
    expect(issues({ phoneNumber: "0708-701-3213" })).toEqual([]);
  });

  it("validates a new password", () => {
    expect(validateNewPassword("short", "short")).toMatch(/at least 8/);
    expect(validateNewPassword("longenough", "different1")).toBe("The passwords don't match.");
    expect(validateNewPassword("longenough", "longenough")).toBe("");
  });
});
