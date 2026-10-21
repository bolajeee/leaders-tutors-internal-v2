import { apiClient } from "@/lib/api-client";
import { isMockMode } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore } from "@/services/mock/demoStore";
import type {
  TransactionStatus,
  TransactionType,
  WalletTransaction,
} from "@/types/payment";

export type { WalletTransaction } from "@/types/payment";

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

export interface RawWalletTransaction {
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

const demo = () => {
  const store = useDemoStore.getState();
  const email = useAuthStore.getState().user?.email;
  if (email) store.ensureAccount(email);
  return useDemoStore.getState();
};

// Load wallet - initiate payment
export const initiateWalletLoad = async (
  amount: number,
): Promise<PaymentInitiation> => {
  if (isMockMode()) {
    const transactionId = `WALLET-${Date.now()}`;
    demo().recordTransaction({
      id: transactionId,
      amount,
      currency: "₦",
      status: "pending",
      type: "load_wallet",
      createdAt: new Date().toISOString(),
      description: "Wallet funding",
    });
    return { transactionId, paymentUrl: "", paystackPaymentKey: "pk_test_local_demo", amount, currency: "₦" };
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
  } catch {
    throw new Error("Failed to initiate wallet loading");
  }
};

// Confirm wallet load success
export const confirmWalletLoadSuccess = async (
  transactionId: string,
): Promise<boolean> => {
  if (isMockMode()) {
    const store = demo();
    const transaction = store.transactions.find((item) => item.id === transactionId);
    if (!transaction) return false;
    if (transaction.status !== "success") {
      store.settleTransaction(transactionId, "success");
      store.creditWallet(transaction.amount);
    }
    return true;
  }
  try {
    await apiClient.post(
      `/user/payment/load-wallet-success?id=${encodeURIComponent(transactionId)}`,
    );
    return true;
  } catch {
    return false;
  }
};

// Cancel wallet load
export const cancelWalletLoad = async (
  transactionId: string,
): Promise<boolean> => {
  if (isMockMode()) {
    demo().settleTransaction(transactionId, "cancelled");
    return true;
  }
  try {
    await apiClient.post(
      `/user/payment/load-wallet-cancel?id=${encodeURIComponent(transactionId)}`,
    );
    return true;
  } catch {
    return false;
  }
};

export const mapRawTransaction = (transaction: RawWalletTransaction): WalletTransaction => ({
  id: transaction.transactionId || transaction.id || "",
  amount: parseFloat(String(transaction.amount ?? "0")) || 0,
  currency: transaction.currency || "₦",
  status: mapTransactionStatus(transaction.statusId ?? ""),
  type: mapTransactionType(transaction.transactionType || transaction.type || ""),
  createdAt: transaction.createdAt || transaction.created_at || "",
  description:
    transaction.description ||
    `${transaction.transactionType || transaction.type || "Transaction"} - ${transaction.amount}`,
});

/**
 * Fetch user transactions. Failures are thrown so screens can show a retry
 * state instead of an empty history.
 */
export const fetchUserTransactions = async (): Promise<WalletTransaction[]> => {
  if (isMockMode()) return demo().transactions;

  const data = await apiClient.get<RawWalletTransaction[]>(
    "/user/payment/fetch-transactions",
  );
  return Array.isArray(data) ? data.map(mapRawTransaction) : [];
};

// Helper function to map status IDs to readable status
export function mapTransactionStatus(statusId: number | string): TransactionStatus {
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
export function mapTransactionType(type: string): TransactionType {
  if (type?.toLowerCase().includes("wallet")) return "load_wallet";
  if (type?.toLowerCase().includes("exam")) return "exam_payment";
  if (type?.toLowerCase().includes("ebook")) return "ebook_payment";
  if (type?.toLowerCase().includes("subscription")) return "subscription";
  return "load_wallet";
}
