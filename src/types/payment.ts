export type TransactionStatus = "pending" | "success" | "failed" | "cancelled";
export type TransactionType =
  | "load_wallet"
  | "exam_payment"
  | "ebook_payment"
  | "subscription";

export interface WalletTransaction {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  type: TransactionType;
  createdAt: string;
  description: string;
}
