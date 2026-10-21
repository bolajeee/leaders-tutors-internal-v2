"use client";

import { useSyncExternalStore } from "react";
import { ShieldCheck } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { isMockMode } from "@/lib/config";
import {
  getActiveMockCheckout,
  settleMockCheckout,
  subscribeMockCheckout,
} from "@/services/mock/checkout";

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/** Renders the simulated Paystack checkout. Mounted once in the app providers. */
export default function MockCheckoutHost() {
  const request = useSyncExternalStore(
    subscribeMockCheckout,
    getActiveMockCheckout,
    () => null,
  );

  if (!isMockMode()) return null;

  return (
    <ModalShell
      isOpen={Boolean(request)}
      title="Paystack checkout"
      onClose={() => settleMockCheckout("cancelled")}
      closeLabel="Close checkout without paying"
    >
      {request && (
        <div className="space-y-5 p-6">
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Simulated checkout for local review. No real payment is taken.
          </p>
          <dl className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">For</dt>
              <dd className="font-medium text-slate-900">{request.purpose}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all font-medium text-slate-900">{request.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-semibold text-slate-900">{formatNaira(request.amount)}</dd>
            </div>
          </dl>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => settleMockCheckout("paid")}
              className="min-h-11 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover-color)]"
            >
              Pay {formatNaira(request.amount)}
            </button>
            <button
              type="button"
              onClick={() => settleMockCheckout("pending")}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Simulate pending confirmation
            </button>
            <button
              type="button"
              onClick={() => settleMockCheckout("cancelled")}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Cancel payment
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
