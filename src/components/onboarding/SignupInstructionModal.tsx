"use client";

import { BookOpen, GraduationCap, Wallet } from "lucide-react";
import { Button } from "@/components/form";
import ModalShell from "@/components/ui/ModalShell";
import { formatAmount } from "@/services/paystack";

interface SignupInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  exam: string;
  amount: number;
  isPaying?: boolean;
  paymentMethodId: string;
  paymentMethodOptions: { value: string; label: string }[];
  paymentMethodError?: string;
  /** False when checkout opens straight after sign-up, with no email code in between. */
  verifiesEmail?: boolean;
  onPaymentMethodChange: (value: string) => void;
  onPayNow: () => void;
}

export default function SignupInstructionModal({
  isOpen,
  onClose,
  department,
  exam,
  amount,
  isPaying = false,
  paymentMethodId,
  paymentMethodOptions,
  paymentMethodError,
  verifiesEmail = true,
  onPaymentMethodChange,
  onPayNow,
}: SignupInstructionModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm your learning plan"
      closeLabel="Close payment instructions"
      dismissible={!isPaying}
    >
      <div className="space-y-4 p-6">
        <p className="text-sm leading-6 text-slate-700">
          {verifiesEmail
            ? "Confirm your class and payment method. We will verify your email before opening secure checkout."
            : "Confirm your class and payment method. Next you will pay securely with Paystack to activate your account."}
        </p>

        <dl className="space-y-3 rounded-lg border border-[var(--border-color)] bg-[var(--gray-color)] p-4">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-blue-50 p-2 text-[var(--primary-color)]">
              <GraduationCap className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-600">Department</dt>
              <dd className="text-sm font-semibold text-slate-900">{department || "Not selected"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-orange-50 p-2 text-orange-700">
              <BookOpen className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-600">Class</dt>
              <dd className="text-sm font-semibold text-slate-900">{exam || "Not selected"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-green-50 p-2 text-emerald-700">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-600">Amount to pay</dt>
              <dd className="text-lg font-bold text-slate-900">{formatAmount(amount)}</dd>
            </div>
          </div>
        </dl>

        <div className="flex w-full flex-col gap-1">
          <label htmlFor="signup-payment-method" className="text-sm font-medium text-slate-900">
            Payment method
          </label>
          <select
            id="signup-payment-method"
            value={paymentMethodId}
            onChange={(event) => onPaymentMethodChange(event.target.value)}
            disabled={isPaying}
            aria-invalid={Boolean(paymentMethodError)}
            aria-describedby={paymentMethodError ? "signup-payment-method-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
          >
            <option value="">Select payment method</option>
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {paymentMethodError ? (
            <span id="signup-payment-method-error" role="alert" className="text-xs text-red-700">
              {paymentMethodError}
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          text={verifiesEmail ? "Continue to verification" : "Proceed to payment"}
          fullWidth
          isLoading={isPaying}
          onClick={onPayNow}
        />
      </div>
    </ModalShell>
  );
}
