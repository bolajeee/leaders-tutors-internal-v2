"use client";

/**
 * PaystackModal Component
 * Reusable modal for Paystack payment integration
 */

import { CreditCard } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { usePaystack } from "@/hooks/usePaystack";
import { isMockMode } from "@/lib/config";
import { convertToKobo, formatAmount } from "@/services/paystack";

interface PaystackModalProps {
  isOpen: boolean;
  /** The dialog was dismissed before payment started. */
  onClose: () => void;
  /** The checkout opened but the shopper left without paying. Defaults to `onClose`. */
  onCancelled?: () => void;
  /** Payment started but is not confirmed yet. */
  onPending?: (reference: string) => void;
  email: string;
  amount: number;
  publicKey?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  title?: string;
  description?: string;
}

const isPlaceholderKey = (key: string) => !key || key.includes("your_paystack_public_key_here");

export const PaystackModal: React.FC<PaystackModalProps> = ({
  isOpen,
  onClose,
  onCancelled,
  onPending,
  email,
  amount,
  publicKey: publicKeyProp,
  metadata,
  onSuccess,
  title = "Complete Payment",
  description = "Click the button below to proceed with your payment",
}) => {
  const publicKey =
    publicKeyProp || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const { initiatePayment, isLoading, error } = usePaystack({
    publicKey,
    onSuccess,
    onClose: onCancelled ?? onClose,
    onPending,
  });

  // The simulated checkout does not need a real key.
  const isKeyMissing = !isMockMode() && isPlaceholderKey(publicKey);

  const handlePayment = () => {
    if (isKeyMissing) return;
    initiatePayment({
      email,
      amount: convertToKobo(amount),
      label: title,
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: "Email",
            variable_name: "email",
            value: email,
          },
        ],
      },
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      closeLabel="Close payment dialog"
      dismissible={!isLoading}
      icon={<CreditCard className="h-5 w-5" />}
    >
      <div className="space-y-4 p-6">
        <p className="text-slate-700">{description}</p>

        <dl className="space-y-2 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-slate-600">Email</dt>
            <dd className="text-sm font-medium text-slate-900">{email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-slate-600">Amount</dt>
            <dd className="text-lg font-bold text-emerald-800">{formatAmount(amount)}</dd>
          </div>
        </dl>

        {(error || isKeyMissing) && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {isKeyMissing
              ? "Online payment isn't set up in this environment yet. Please contact support."
              : error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePayment}
          disabled={isLoading || isKeyMissing}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-800 disabled:bg-slate-400"
        >
          {isLoading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
              <span>Processing…</span>
            </>
          ) : isKeyMissing ? (
            <span>Payment not available</span>
          ) : (
            <span>Pay {formatAmount(amount)}</span>
          )}
        </button>

        <p className="text-center text-xs text-slate-600">Secured by Paystack</p>
      </div>
    </ModalShell>
  );
};
