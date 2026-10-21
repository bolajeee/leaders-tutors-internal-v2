import type { WalletTransaction } from "@/types/payment";

export const TRANSACTION_TYPE_LABELS: Record<WalletTransaction["type"], string> = {
  load_wallet: "Wallet funding",
  subscription: "Subscription",
  exam_payment: "Exam payment",
  ebook_payment: "E-book payment",
};

export const formatMoney = (amount: number, currency = "₦") =>
  `${currency}${amount.toLocaleString("en-NG")}`;

export const formatTransactionDate = (iso: string, withTime = false) => {
  const date = new Date(iso);
  if (Number.isNaN(+date)) return "—";
  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  });
};

/** Only completed payments have a receipt. */
export const hasReceipt = (transaction: WalletTransaction) => transaction.status === "success";

export const buildReceipt = (transaction: WalletTransaction, studentName?: string) =>
  [
    "LEADERS TUTORS - PAYMENT RECEIPT",
    "",
    ...(studentName ? [`Student:     ${studentName}`] : []),
    `Reference:   ${transaction.id}`,
    `Purpose:     ${transaction.description}`,
    `Type:        ${TRANSACTION_TYPE_LABELS[transaction.type]}`,
    `Amount:      ${formatMoney(transaction.amount, transaction.currency)}`,
    `Status:      ${transaction.status}`,
    `Date:        ${formatTransactionDate(transaction.createdAt, true)}`,
    "",
    "Thank you for learning with Leaders Tutors.",
    "",
  ].join("\n");

export const downloadReceipt = (transaction: WalletTransaction, studentName?: string) => {
  const url = URL.createObjectURL(
    new Blob([buildReceipt(transaction, studentName)], { type: "text/plain" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${transaction.id}-receipt.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const csvCell = (value: string | number) => {
  const text = String(value);
  // Quote cells with separators, and neutralise spreadsheet formula prefixes.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const buildTransactionsCsv = (transactions: WalletTransaction[]) =>
  [
    ["Reference", "Purpose", "Type", "Amount", "Currency", "Status", "Date"],
    ...transactions.map((item) => [
      item.id,
      item.description,
      TRANSACTION_TYPE_LABELS[item.type],
      item.amount,
      item.currency,
      item.status,
      item.createdAt,
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

export const downloadTransactionsCsv = (transactions: WalletTransaction[], filename = "payment-history.csv") => {
  const url = URL.createObjectURL(new Blob([buildTransactionsCsv(transactions)], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
