import { apiClient } from "@/lib/api-client";

export interface WalletTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "cancelled";
  type: "load_wallet" | "exam_payment" | "ebook_payment" | "subscription";
  createdAt: string;
  description: string;
}

export interface PaymentInitiation {
  transactionId: string;
  paymentUrl: string;
  paystackPaymentKey: string;
  amount: number;
  currency: string;
}

interface PaymentApiResponse {
  transactionId?: string;
  id?: string;
  paymentUrl?: string;
  authorization_url?: string;
  paystackPaymentKey?: string;
  amount?: number | string;
  currency?: string;
  paymentProceedData?: PaymentApiResponse;
}

interface RawWalletTransaction {
  transactionId?: string;
  id?: string;
  amount?: string | number;
  currency?: string;
  statusId?: number | string;
  transactionType?: string;
  type?: string;
  createdAt?: string;
  created_at?: string;
  description?: string;
}

// Load wallet - initiate payment
export const initiateWalletLoad = async (
  amount: number,
): Promise<PaymentInitiation> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return { transactionId: `WALLET-${Date.now()}`, paymentUrl: "", paystackPaymentKey: "pk_test_local_demo", amount, currency: "₦" };
  }
  try {
    const response = await apiClient.post<PaymentApiResponse>(
      "/user/payment/load-wallet-log",
      {
        amount: amount.toString(),
      },
    );
    // Same envelope as signup: details may sit under paymentProceedData.
    const data = { ...response, ...response?.paymentProceedData };
    const transactionId = data.transactionId || data.id || "";
    if (!transactionId) {
      throw new Error("No transaction id returned");
    }

    return {
      transactionId,
      paymentUrl: data.paymentUrl || data.authorization_url || "",
      paystackPaymentKey: data.paystackPaymentKey || "",
      amount: Number(data.amount) || amount,
      currency: data.currency || "₦",
    };
  } catch (error) {
    console.error("Wallet load initiation failed:", error);
    throw new Error("Failed to initiate wallet loading");
  }
};

// Confirm wallet load success
export const confirmWalletLoadSuccess = async (
  transactionId: string,
): Promise<boolean> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") return Boolean(transactionId);
  try {
    await apiClient.post(
      `/user/payment/load-wallet-success?id=${transactionId}`,
    );
    return true;
  } catch (error) {
    console.error("Wallet load confirmation failed:", error);
    return false;
  }
};

// Cancel wallet load
export const cancelWalletLoad = async (
  transactionId: string,
): Promise<boolean> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") return Boolean(transactionId);
  try {
    await apiClient.post(
      `/user/payment/load-wallet-cancel?id=${transactionId}`,
    );
    return true;
  } catch (error) {
    console.error("Wallet load cancellation failed:", error);
    return false;
  }
};

// Fetch user transactions
export const fetchUserTransactions = async (): Promise<WalletTransaction[]> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return [
      { id: "TRANS-DEMO-1001", amount: 1000, currency: "₦", status: "success", type: "subscription", createdAt: "2026-10-21T09:57:46+01:00", description: "Student plan renewal" },
      { id: "TRANS-DEMO-1002", amount: 10000, currency: "₦", status: "success", type: "load_wallet", createdAt: "2026-10-16T12:58:18+01:00", description: "Wallet funding" },
      { id: "TRANS-DEMO-1003", amount: 1000, currency: "₦", status: "cancelled", type: "subscription", createdAt: "2026-09-03T09:23:24+01:00", description: "Subscription payment" },
    ];
  }
  try {
    const data = await apiClient.get<RawWalletTransaction[]>(
      "/user/payment/fetch-transactions",
    );

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((transaction) => ({
      id: transaction.transactionId || transaction.id || "",
      amount: parseFloat(String(transaction.amount ?? "0")),
      currency: transaction.currency || "₦",
      status: mapTransactionStatus(transaction.statusId ?? ""),
      type: mapTransactionType(
        transaction.transactionType || transaction.type || "",
      ),
      createdAt: transaction.createdAt || transaction.created_at || "",
      description:
        transaction.description ||
        `${transaction.type || "Transaction"} - ${transaction.amount}`,
    }));
  } catch (error) {
    console.error("Transactions fetch failed:", error);
    return [];
  }
};

// Helper function to map status IDs to readable status
function mapTransactionStatus(
  statusId: number | string,
): "pending" | "success" | "failed" | "cancelled" {
  switch (statusId?.toString()) {
    case "3":
      return "pending";
    case "4":
      return "success";
    case "5":
      return "cancelled";
    default:
      return "failed";
  }
}

// Helper function to map transaction types
function mapTransactionType(
  type: string,
): "load_wallet" | "exam_payment" | "ebook_payment" | "subscription" {
  if (type?.toLowerCase().includes("wallet")) return "load_wallet";
  if (type?.toLowerCase().includes("exam")) return "exam_payment";
  if (type?.toLowerCase().includes("ebook")) return "ebook_payment";
  if (type?.toLowerCase().includes("subscription")) return "subscription";
  return "load_wallet";
}
