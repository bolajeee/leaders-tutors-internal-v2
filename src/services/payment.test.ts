import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelWalletLoad,
  confirmWalletLoadSuccess,
  fetchUserTransactions,
  initiateWalletLoad,
  mapRawTransaction,
  mapTransactionStatus,
  mapTransactionType,
} from "./payment";
import { useDemoStore } from "./mock/demoStore";
import { resetAppState, signInAs } from "@/test/utils";

describe("wallet loading (mock mode)", () => {
  beforeEach(() => {
    resetAppState();
    signInAs("active");
  });

  it("credits the wallet only after the load is confirmed", async () => {
    const before = useDemoStore.getState().walletBalance;
    const payment = await initiateWalletLoad(5000);
    expect(useDemoStore.getState().walletBalance).toBe(before);
    expect((await fetchUserTransactions())[0]).toMatchObject({ id: payment.transactionId, status: "pending" });

    await expect(confirmWalletLoadSuccess(payment.transactionId)).resolves.toBe(true);
    expect(useDemoStore.getState().walletBalance).toBe(before + 5000);
    expect((await fetchUserTransactions())[0].status).toBe("success");
  });

  it("does not credit the wallet twice for the same transaction", async () => {
    const payment = await initiateWalletLoad(1000);
    await confirmWalletLoadSuccess(payment.transactionId);
    const balance = useDemoStore.getState().walletBalance;
    await confirmWalletLoadSuccess(payment.transactionId);
    expect(useDemoStore.getState().walletBalance).toBe(balance);
  });

  it("marks a cancelled load and leaves the balance alone", async () => {
    const before = useDemoStore.getState().walletBalance;
    const payment = await initiateWalletLoad(2000);
    await cancelWalletLoad(payment.transactionId);
    expect(useDemoStore.getState().walletBalance).toBe(before);
    expect((await fetchUserTransactions())[0]).toMatchObject({ id: payment.transactionId, status: "cancelled" });
  });

  it("fails to confirm a transaction that does not exist", async () => {
    await expect(confirmWalletLoadSuccess("MISSING")).resolves.toBe(false);
  });
});

describe("transaction mapping", () => {
  it("maps API status ids", () => {
    expect(mapTransactionStatus(3)).toBe("pending");
    expect(mapTransactionStatus("4")).toBe("success");
    expect(mapTransactionStatus(5)).toBe("cancelled");
    expect(mapTransactionStatus(9)).toBe("failed");
  });

  it("maps API transaction types", () => {
    expect(mapTransactionType("Load Wallet")).toBe("load_wallet");
    expect(mapTransactionType("subscription renewal")).toBe("subscription");
    expect(mapTransactionType("exam fee")).toBe("exam_payment");
  });

  it("normalizes a raw API transaction", () => {
    expect(
      mapRawTransaction({
        transactionId: "T-1",
        amount: "1500.50",
        statusId: 4,
        transactionType: "subscription",
        created_at: "2026-01-01T00:00:00Z",
      }),
    ).toMatchObject({
      id: "T-1",
      amount: 1500.5,
      currency: "₦",
      status: "success",
      type: "subscription",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });
});
