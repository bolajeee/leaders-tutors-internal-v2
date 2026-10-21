"use client";

import { useMemo, useState } from "react";
import { CalendarSync, Download, Eye, Wallet } from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import WalletLoadModal from "@/components/wallet/WalletLoadModal";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import TransactionDetailsModal from "@/components/payment/TransactionDetailsModal";
import { Badge, ProgressBar } from "@/components/ui";
import { EmptyPanel, ErrorState, LoadingRows } from "@/components/ui/State";
import { TransactionStatusBadge } from "@/components/ui/TransactionStatusBadge";
import { useSubscription, useTransactions } from "@/hooks/usePortalData";
import { getRenewalCapability, SUBSCRIPTION_PRICE } from "@/lib/config";
import type { WalletTransaction } from "@/types/payment";
import { downloadTransactionsCsv, formatMoney, formatTransactionDate } from "@/utils/receipt";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-hover-color)] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50";

export default function Subscriptions() {
  const { subscription, access, isPending: subscriptionPending, error: subscriptionError, refetch: refetchSubscription } = useSubscription();
  const transactions = useTransactions();
  const [showWallet, setShowWallet] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [selected, setSelected] = useState<WalletTransaction | null>(null);
  const renewal = getRenewalCapability();

  const payments = useMemo(
    () => (transactions.data ?? []).filter((item) => item.type === "subscription" || item.type === "exam_payment"),
    [transactions.data],
  );

  const daysLeft = subscription?.daysLeft ?? 0;

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
        <header>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]">
            <CalendarSync className="h-4 w-4" aria-hidden />
            Your plan
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Check your access, renew your plan and review payments.</p>
        </header>

        <section aria-labelledby="current-plan" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {subscriptionPending ? (
            <LoadingRows label="Loading your plan" rows={2} />
          ) : access === "error" || !subscription ? (
            <ErrorState
              compact
              title="Your plan couldn't be loaded"
              message={subscriptionError instanceof Error ? subscriptionError.message : "Please try again."}
              onRetry={() => void refetchSubscription()}
            />
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="current-plan" className="text-lg font-semibold text-slate-900">
                    {subscription.subscriptionType || "Student plan"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {[subscription.departmentName, subscription.examAbbreviation].filter(Boolean).join(" · ") || "Your class"}
                  </p>
                </div>
                <Badge tone={access === "active" ? "success" : "danger"} dot>
                  {access === "active" ? "Active" : "Expired"}
                </Badge>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-600">{access === "active" ? "Expires" : "Expired on"}</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatTransactionDate(subscription.subscriptionExpiresAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-600">Time remaining</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {access === "active" ? `${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-600">Wallet balance</dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-800">
                    {formatMoney(subscription.walletBalance, subscription.currency)}
                  </dd>
                </div>
              </dl>

              {access === "active" && (
                <div className="mt-5">
                  <p className="sr-only">{daysLeft} of {SUBSCRIPTION_PRICE.days} days remaining</p>
                  <ProgressBar value={(daysLeft / SUBSCRIPTION_PRICE.days) * 100} />
                </div>
              )}
              {access === "expired" && (
                <p role="status" className="mt-5 rounded-xl bg-orange-50 p-3 text-sm leading-6 text-orange-950">
                  Your access has expired. You can still browse the curriculum, but lessons open again once you renew.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowRenewal(true)}
                  disabled={!renewal.available}
                  aria-describedby={renewal.available ? undefined : "renewal-unavailable"}
                  className={primaryButton}
                >
                  <CalendarSync className="h-4 w-4" aria-hidden />
                  {access === "active" ? "Renew early" : "Renew access"}
                </button>
                <button type="button" onClick={() => setShowWallet(true)} className={secondaryButton}>
                  <Wallet className="h-4 w-4" aria-hidden />
                  Load wallet
                </button>
              </div>
              {!renewal.available && (
                <p id="renewal-unavailable" className="mt-3 text-sm leading-6 text-slate-700">
                  {renewal.reason}
                </p>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="history-heading" className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 id="history-heading" className="text-sm font-bold uppercase tracking-wide text-slate-800">
              Payment history
            </h2>
            <button
              type="button"
              onClick={() => downloadTransactionsCsv(payments, "subscription-payments.csv")}
              disabled={payments.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download CSV
            </button>
          </div>

          {transactions.isPending ? (
            <LoadingRows label="Loading payment history" />
          ) : transactions.isError ? (
            <ErrorState
              title="Payment history unavailable"
              message={transactions.error instanceof Error ? transactions.error.message : "We could not load your payments."}
              onRetry={() => void transactions.refetch()}
            />
          ) : payments.length === 0 ? (
            <EmptyPanel icon={CalendarSync} title="No subscription payments yet" message="Your subscription payments will be listed here." />
          ) : (
            <>
              <ul className="divide-y divide-slate-100 md:hidden">
                {payments.map((item) => (
                  <li key={item.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-slate-900">{item.id}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                      <TransactionStatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-slate-700">
                      {formatMoney(item.amount, item.currency)} · {formatTransactionDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 text-xs font-semibold text-[var(--primary-color)]"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View details{" "}<span className="sr-only">for {item.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Subscription payments</caption>
                  <thead className="text-xs uppercase text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th scope="col" className="px-6 py-4">Reference</th>
                      <th scope="col" className="px-6 py-4">Purpose</th>
                      <th scope="col" className="px-6 py-4">Amount</th>
                      <th scope="col" className="px-6 py-4">Date</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <th scope="row" className="px-6 py-4 font-medium text-slate-900">{item.id}</th>
                        <td className="px-6 py-4 text-slate-700">{item.description}</td>
                        <td className="px-6 py-4 font-semibold">{formatMoney(item.amount, item.currency)}</td>
                        <td className="px-6 py-4 text-slate-600">{formatTransactionDate(item.createdAt)}</td>
                        <td className="px-6 py-4"><TransactionStatusBadge status={item.status} /></td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-[var(--primary-color)] hover:bg-indigo-100"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            View details{" "}<span className="sr-only">for {item.id}</span>
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

      <WalletLoadModal isOpen={showWallet} onClose={() => setShowWallet(false)} onSuccess={() => undefined} />
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
      <TransactionDetailsModal transaction={selected} onClose={() => setSelected(null)} />
    </PortalWrapper>
  );
}
