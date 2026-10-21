"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { renewSubscription } from "@/services/billing";
import { getRenewalCapability, SUBSCRIPTION_PRICE } from "@/lib/config";
import {
  FeatureUnavailableError,
  PaymentCancelledError,
  getErrorMessage,
} from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
import { useRefreshAccount, useSubscription } from "@/hooks/usePortalData";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Status = "idle" | "processing" | "success" | "cancelled" | "pending" | "error";

const actionButton =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

export default function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  const email = useAuthStore((state) => state.user?.email ?? "");
  const refreshAccount = useRefreshAccount();
  const { refetch } = useSubscription();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const capability = getRenewalCapability();

  const close = () => {
    if (status === "processing") return;
    setStatus("idle");
    setMessage("");
    onClose();
  };

  const proceed = async () => {
    setStatus("processing");
    setMessage("");
    try {
      const result = await renewSubscription(email);
      await refreshAccount();
      if (result.status === "pending") {
        setStatus("pending");
        setMessage("Your payment is being confirmed. Your access updates as soon as it is.");
        return;
      }
      setStatus("success");
      setMessage(`${result.daysAdded} days of learning access have been added.`);
    } catch (failure) {
      if (failure instanceof PaymentCancelledError) {
        setStatus("cancelled");
        setMessage("Payment was cancelled and no money was taken. You can try again whenever you are ready.");
        await refreshAccount();
      } else if (failure instanceof FeatureUnavailableError) {
        setStatus("idle");
        setMessage(failure.message);
      } else {
        setStatus("error");
        setMessage(getErrorMessage(failure, "We could not complete your renewal."));
      }
    }
  };

  const refreshStatus = async () => {
    const result = await refetch();
    if (result.data?.isSubscriptionActive) {
      setStatus("success");
      setMessage("Your payment was confirmed and your access is active.");
    } else {
      setMessage("Still waiting for confirmation. Check again in a few minutes.");
    }
  };

  const finish = () => {
    onSuccess?.();
    setStatus("idle");
    setMessage("");
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="Renew learning access"
      onClose={close}
      closeLabel="Close renewal dialog"
      dismissible={status !== "processing"}
      icon={<CalendarCheck className="h-5 w-5" />}
    >
      <div className="p-6">
        {status === "success" ? (
          <div className="py-4 text-center" role="status">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Access renewed</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <button
              type="button"
              onClick={finish}
              className={`${actionButton} mt-6 w-full bg-[var(--primary-color)] text-white`}
            >
              Continue learning
            </button>
          </div>
        ) : status === "pending" ? (
          <div className="py-2 text-center">
            <Clock className="mx-auto h-12 w-12 text-amber-600" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Payment pending</h3>
            <p role="status" className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={close} className={`${actionButton} border border-slate-200 text-slate-700`}>
                Close
              </button>
              <button type="button" onClick={() => void refreshStatus()} className={`${actionButton} bg-[var(--primary-color)] text-white`}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh status
              </button>
            </div>
            <Link href="/transactions" onClick={close} className="mt-4 inline-block text-sm font-semibold text-[var(--primary-color)] underline">
              View in transactions
            </Link>
          </div>
        ) : status === "cancelled" ? (
          <div className="py-2 text-center">
            <XCircle className="mx-auto h-12 w-12 text-slate-500" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Payment cancelled</h3>
            <p role="status" className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={close} className={`${actionButton} border border-slate-200 text-slate-700`}>
                Not now
              </button>
              <button type="button" onClick={() => void proceed()} className={`${actionButton} bg-[var(--primary-color)] text-white`}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Student plan</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">
                  {SUBSCRIPTION_PRICE.currency}
                  {SUBSCRIPTION_PRICE.amount.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">{SUBSCRIPTION_PRICE.days} days</p>
              </div>
            </div>
            <ul className="my-5 space-y-3 text-sm text-slate-700">
              {["All available curriculum lessons", "Lesson notes and CBT practice", "Secure, immediate activation"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            {(message || !capability.available) && (
              <p
                role={status === "error" ? "alert" : "status"}
                className={`mb-4 rounded-xl p-3 text-sm leading-6 ${status === "error" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}
              >
                {message || capability.reason}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={close} disabled={status === "processing"} className={`${actionButton} border border-slate-200 text-slate-700`}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void proceed()}
                disabled={status === "processing" || !capability.available}
                className={`${actionButton} bg-[var(--primary-color)] text-white`}
              >
                {status === "processing" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                    Processing
                  </>
                ) : status === "error" ? (
                  "Try again"
                ) : (
                  "Proceed"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
