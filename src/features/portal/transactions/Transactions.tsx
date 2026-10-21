"use client";

import { useMemo, useState } from "react";
import { Eye, ReceiptText, Search } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import TransactionDetailsModal from "@/components/payment/TransactionDetailsModal";
import { EmptyPanel, ErrorState, LoadingRows } from "@/components/ui/State";
import { TransactionStatusBadge } from "@/components/ui/TransactionStatusBadge";
import { useTransactions } from "@/hooks/usePortalData";
import type { TransactionStatus, WalletTransaction } from "@/types/payment";
import { formatMoney, formatTransactionDate } from "@/utils/receipt";

const STATUS_OPTIONS: { value: "all" | TransactionStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Successful" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

export default function Transactions() {
  const { data, isPending, isError, error, refetch } = useTransactions();
  const [status, setStatus] = useState<"all" | TransactionStatus>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<WalletTransaction | null>(null);

  const items = useMemo(() => data ?? [], [data]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (!needle || `${item.id} ${item.description}`.toLowerCase().includes(needle)),
    );
  }, [items, status, query]);

  const filtered = status !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setStatus("all");
    setQuery("");
  };

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
        <header>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]">
            <ReceiptText className="h-4 w-4" aria-hidden />
            Payments
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Transaction history</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review wallet funding, subscription payments, and receipts.
          </p>
        </header>

        <section aria-label="Transactions" className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block sm:max-w-sm sm:flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden />
              <span className="sr-only">Search transactions</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference or purpose"
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="sr-only sm:not-sr-only">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | TransactionStatus)}
                aria-label="Filter by status"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm sm:w-auto"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isPending ? (
            <LoadingRows label="Loading transactions" />
          ) : isError ? (
            <ErrorState
              title="Transactions unavailable"
              message={error instanceof Error ? error.message : "We could not load your payment history."}
              onRetry={() => void refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyPanel icon={ReceiptText} title="No transactions yet" message="Wallet top-ups and subscription payments will appear here." />
          ) : visible.length === 0 ? (
            <EmptyPanel
              icon={Search}
              title="No transactions match your filters"
              message="Try a different status or search term."
              action={
                <button type="button" onClick={clearFilters} className="font-semibold text-[var(--primary-color)] underline">
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <p role="status" className="sr-only">
                {visible.length} transaction{visible.length === 1 ? "" : "s"} shown{filtered ? " after filtering" : ""}
              </p>
              {/* Small screens: one card per transaction. */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {visible.map((item) => (
                  <li key={item.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-slate-900">{item.id}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                      <TransactionStatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">{formatMoney(item.amount, item.currency)}</span>
                      <span className="text-slate-600">{formatTransactionDate(item.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 text-xs font-semibold text-[var(--primary-color)]"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Details
                      {" "}
                      <span className="sr-only">for {item.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Payment and wallet transactions</caption>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                    <tr>
                      <th scope="col" className="px-5 py-4">Reference</th>
                      <th scope="col" className="px-5 py-4">Purpose</th>
                      <th scope="col" className="px-5 py-4">Amount</th>
                      <th scope="col" className="px-5 py-4">Status</th>
                      <th scope="col" className="px-5 py-4">Date</th>
                      <th scope="col" className="px-5 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <th scope="row" className="px-5 py-4 font-medium text-slate-900">{item.id}</th>
                        <td className="px-5 py-4 text-slate-700">{item.description}</td>
                        <td className="px-5 py-4 font-semibold">{formatMoney(item.amount, item.currency)}</td>
                        <td className="px-5 py-4"><TransactionStatusBadge status={item.status} /></td>
                        <td className="px-5 py-4 text-slate-600">{formatTransactionDate(item.createdAt)}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-[var(--primary-color)] hover:bg-indigo-100"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            Details
                            {" "}
                      <span className="sr-only">for {item.id}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <TransactionDetailsModal transaction={selected} onClose={() => setSelected(null)} />
    </PortalWrapper>
  );
}
