"use client";

import { Download, ReceiptText } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { TransactionStatusBadge } from "@/components/ui/TransactionStatusBadge";
import { useAuthStore } from "@/store/authStore";
import type { WalletTransaction } from "@/types/payment";
import {
  TRANSACTION_TYPE_LABELS,
  downloadReceipt,
  formatMoney,
  formatTransactionDate,
  hasReceipt,
} from "@/utils/receipt";

export default function TransactionDetailsModal({
  transaction,
  onClose,
}: {
  transaction: WalletTransaction | null;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const studentName = user ? `${user.first_name} ${user.last_name}`.trim() : undefined;

  return (
    <ModalShell
      isOpen={Boolean(transaction)}
      title="Transaction details"
      onClose={onClose}
      closeLabel="Close transaction details"
      icon={<ReceiptText className="h-5 w-5" />}
    >
      {transaction && (
        <div className="p-6">
          <p className="text-lg font-semibold text-slate-900">{transaction.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
            <div>
              <dt className="text-slate-600">Reference</dt>
              <dd className="mt-1 break-all font-medium">{transaction.id}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Status</dt>
              <dd className="mt-1"><TransactionStatusBadge status={transaction.status} /></dd>
            </div>
            <div>
              <dt className="text-slate-600">Amount</dt>
              <dd className="mt-1 font-semibold">{formatMoney(transaction.amount, transaction.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Type</dt>
              <dd className="mt-1">{TRANSACTION_TYPE_LABELS[transaction.type]}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-600">Date</dt>
              <dd className="mt-1">{formatTransactionDate(transaction.createdAt, true)}</dd>
            </div>
          </dl>
          {hasReceipt(transaction) ? (
            <button
              type="button"
              onClick={() => downloadReceipt(transaction, studentName)}
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] text-sm font-semibold text-white"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download receipt
            </button>
          ) : (
            <p className="mt-7 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              A receipt is available once a payment is successful.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
