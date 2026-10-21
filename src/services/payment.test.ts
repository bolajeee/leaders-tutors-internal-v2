import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));

import { liveCall } from "@/lib/live-api";
import { ApiError } from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
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
  it("maps the API's status names", () => {
    expect(mapTransactionStatus("PENDING")).toBe("pending");
    expect(mapTransactionStatus("SUCCESS")).toBe("success");
    expect(mapTransactionStatus("Successful")).toBe("success");
    expect(mapTransactionStatus("CANCELLED")).toBe("cancelled");
    expect(mapTransactionStatus("FAILED")).toBe("failed");
    expect(mapTransactionStatus("")).toBe("failed");
  });

  it("maps API transaction types", () => {
    expect(mapTransactionType("Load Wallet")).toBe("load_wallet");
    expect(mapTransactionType("subscription renewal")).toBe("subscription");
    expect(mapTransactionType("exam fee")).toBe("exam_payment");
  });

  it("normalizes a raw API transaction", () => {
    expect(
      mapRawTransaction({
        transaction_id: "T-1",
        amount: "1,500.50",
        status_name: "SUCCESS",
        transaction_type_name: "SUBSCRIPTION RENEWAL",
        payment_method_name: "DIRECT ONLINE PAYMENT",
        created_time: "2026-01-01 08:30:00",
      }),
    ).toMatchObject({
      id: "T-1",
      amount: 1500.5,
      currency: "₦",
      status: "success",
      type: "subscription",
      createdAt: "2026-01-01 08:30:00",
      description: "Subscription Renewal · Direct Online Payment",
    });
  });
});

describe("wallet and transactions (api mode)", () => {
  beforeEach(() => {
    resetAppState();
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    useAuthStore.setState({ token: "real-token" });
    vi.mocked(liveCall).mockReset();
  });

  it("logs the wallet load with the API and returns the payment to make", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      success: true,
      message: "",
      transaction_id: "TRX-5",
      amount: "2000",
      paystack_payment_key: "pk_test_live",
    });
    await expect(initiateWalletLoad(2000)).resolves.toEqual({
      transactionId: "TRX-5",
      paymentUrl: "",
      paystackPaymentKey: "pk_test_live",
      amount: 2000,
      currency: "₦",
    });
    expect(liveCall).toHaveBeenCalledWith("/user/transactions/load-wallet-pending", { amount: 2000 });
  });

  it("lets the API's own refusal reach the screen", async () => {
    vi.mocked(liveCall).mockRejectedValue(new ApiError("Minimum amount is 500.", 400));
    await expect(initiateWalletLoad(10)).rejects.toThrow("Minimum amount is 500.");
  });

  it("keeps the credited balance the API reports once the load is confirmed", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      success: true,
      message: "",
      user: [{ user_id: "u", access_key: "k", wallet_balance: "7000.00", status_name: "ACTIVE" }],
      subscription: [],
    });
    await expect(confirmWalletLoadSuccess("TRX-5")).resolves.toBe(true);
    expect(liveCall).toHaveBeenCalledWith("/user/transactions/load-wallet-success", { transaction_id: "TRX-5" });
    expect(useAuthStore.getState().account?.walletBalance).toBe(7000);
  });

  it("reports a failed confirmation or cancellation as false instead of throwing", async () => {
    vi.mocked(liveCall).mockRejectedValue(new ApiError("Transaction not found.", 400));
    await expect(confirmWalletLoadSuccess("X")).resolves.toBe(false);
    await expect(cancelWalletLoad("X")).resolves.toBe(false);
  });

  it("lists the student's transactions from the live history", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      success: true,
      message: "",
      data: [
        { transaction_id: "T-9", amount: "1000.00", transaction_type_name: "LOAD WALLET", payment_method_name: "DIRECT ONLINE PAYMENT", status_name: "PENDING", created_time: "2026-10-01 09:00:00" },
      ],
    });
    await expect(fetchUserTransactions()).resolves.toEqual([
      expect.objectContaining({ id: "T-9", amount: 1000, type: "load_wallet", status: "pending" }),
    ]);
    expect(liveCall).toHaveBeenCalledWith("/user/transactions/transaction-history");
  });

  it("treats the API's \"no transactions yet\" reply as an empty history, but surfaces real failures", async () => {
    vi.mocked(liveCall).mockRejectedValueOnce(new ApiError("No transaction found.", 400));
    await expect(fetchUserTransactions()).resolves.toEqual([]);
    vi.mocked(liveCall).mockRejectedValueOnce(new ApiError("Your session has expired.", 401));
    await expect(fetchUserTransactions()).rejects.toMatchObject({ status: 401 });
  });
});
