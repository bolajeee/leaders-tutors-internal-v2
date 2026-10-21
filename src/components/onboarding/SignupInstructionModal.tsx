"use client";

import { BookOpen, GraduationCap, Wallet, X } from "lucide-react";
import { Button } from "@/components/form";
import { Modal } from "@/components/dialog-box/Modal";
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
  onPaymentMethodChange,
  onPayNow,
}: SignupInstructionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOutsideClick={!isPaying}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-bold text-[var(--title-color)] font-bold-custom">
              Confirm your learning plan
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPaying}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close payment instructions"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-[var(--text-color)]">
              Confirm your class and payment method. We will verify your email
              before opening secure checkout.
            </p>

            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--gray-color)] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-[var(--primary-color)]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary-color)]">
                    Department
                  </p>
                  <p className="text-sm font-semibold text-[var(--title-color)]">
                    {department || "Not selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 text-[var(--secondary-color)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary-color)]">
                    Exam type
                  </p>
                  <p className="text-sm font-semibold text-[var(--title-color)]">
                    {exam || "Not selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-emerald-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary-color)]">
                    Amount to pay
                  </p>
                  <p className="text-lg font-bold text-[var(--title-color)]">
                    {formatAmount(amount)}
                  </p>
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-1 w-full">
              <span className="text-sm font-medium text-[var(--title-color)]">
                Payment Method
              </span>
              <select
                value={paymentMethodId}
                onChange={(event) => onPaymentMethodChange(event.target.value)}
                disabled={isPaying}
                className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-3 text-sm text-[var(--title-color)]"
              >
                <option value="">Select payment method</option>
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {paymentMethodError ? (
                <span className="text-xs text-[var(--failed-color)]">
                  {paymentMethodError}
                </span>
              ) : null}
            </label>

            <Button
              type="button"
              text="Continue to verification"
              fullWidth
              isLoading={isPaying}
              onClick={onPayNow}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
