import { isMockMode } from "@/lib/config";
import { ApiError } from "@/lib/errors";
import { liveCall } from "@/lib/live-api";
import { parseLiveAccount } from "@/services/live-account";
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

/** One row of the live `transaction-history` reply. */
export interface RawWalletTransaction {
  transaction_id?: string;
  amount?: string | number;
  transaction_type_name?: string;
  payment_method_name?: string;
  status_name?: string;
  created_time?: string;
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
  const reply = await liveCall<{
    transaction_id?: string | number;
    amount?: string | number;
    paystack_payment_key?: string;
  }>("/user/transactions/load-wallet-pending", { amount });
  const transactionId = reply.transaction_id ? String(reply.transaction_id) : "";
  if (!transactionId) throw new Error("We couldn't start the wallet payment. Please try again.");

  return {
    transactionId,
    paymentUrl: "",
    paystackPaymentKey: reply.paystack_payment_key ? String(reply.paystack_payment_key) : "",
    amount: Number(reply.amount) || amount,
    currency: "₦",
  };
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
    const reply = await liveCall("/user/transactions/load-wallet-success", { transaction_id: transactionId });
    // The reply reports the credited balance; keep it so the wallet updates at once.
    const account = parseLiveAccount(reply);
    if (account) useAuthStore.getState().setAccount(account);
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
    await liveCall("/user/transactions/load-wallet-cancelled", { transaction_id: transactionId });
    return true;
  } catch {
    return false;
  }
};

const titleCase = (value: string) =>
  value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export const mapRawTransaction = (transaction: RawWalletTransaction): WalletTransaction => {
  const purpose = titleCase(transaction.transaction_type_name || "Transaction");
  const method = transaction.payment_method_name ? titleCase(transaction.payment_method_name) : "";
  return {
    id: transaction.transaction_id || "",
    amount: parseFloat(String(transaction.amount ?? "0").replace(/,/g, "")) || 0,
    currency: "₦",
    status: mapTransactionStatus(transaction.status_name ?? ""),
    type: mapTransactionType(transaction.transaction_type_name || ""),
    createdAt: transaction.created_time || "",
    description: method ? `${purpose} · ${method}` : purpose,
  };
};

/**
 * Fetch user transactions. Failures are thrown so screens can show a retry
 * state instead of an empty history.
 */
export const fetchUserTransactions = async (): Promise<WalletTransaction[]> => {
  if (isMockMode()) return demo().transactions;

  try {
    const { data } = await liveCall<{ data: RawWalletTransaction[] }>("/user/transactions/transaction-history");
    return Array.isArray(data) ? data.map(mapRawTransaction) : [];
  } catch (error) {
    // The API reports "no transactions yet" as an unsuccessful reply, not an empty list.
    if (error instanceof ApiError && error.status === 400 && /\b(no|not found|empty|yet)\b/i.test(error.message)) {
      return [];
    }
    throw error;
  }
};

// Helper function to map the API's status names to a readable status
export function mapTransactionStatus(statusName: number | string): TransactionStatus {
  const status = String(statusName ?? "").toLowerCase();
  if (/success|complete|approved|paid/.test(status)) return "success";
  if (/pend|process|initiat/.test(status)) return "pending";
  if (/cancel/.test(status)) return "cancelled";
  return "failed";
}

// Helper function to map transaction types
export function mapTransactionType(type: string): TransactionType {
  if (type?.toLowerCase().includes("wallet")) return "load_wallet";
  if (type?.toLowerCase().includes("exam")) return "exam_payment";
  if (type?.toLowerCase().includes("ebook")) return "ebook_payment";
  if (/subscription|renew/i.test(type ?? "")) return "subscription";
  return "load_wallet";
}
