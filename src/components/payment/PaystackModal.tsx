"use client";

/**
 * PaystackModal Component
 * Reusable modal for Paystack payment integration
 */

import { X } from "lucide-react";
import { usePaystack } from "@/hooks/usePaystack";
import { convertToKobo, formatAmount } from "@/services/paystack";

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  amount: number;
  publicKey?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  title?: string;
  description?: string;
}

export const PaystackModal: React.FC<PaystackModalProps> = ({
  isOpen,
  onClose,
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
    onClose,
  });

  const handlePayment = () => {
    if (!publicKey || publicKey.includes("your_paystack_public_key_here")) {
      console.error("Paystack public key is not configured properly");
      return;
    }

    initiatePayment({
      email,
      amount: convertToKobo(amount),
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

  if (!isOpen) return null;

  const isKeyMissing =
    !publicKey || publicKey.includes("your_paystack_public_key_here");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600">{description}</p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-lg font-bold text-green-600">
                {formatAmount(amount)}
              </span>
            </div>
          </div>

          {(error || isKeyMissing) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                {isKeyMissing
                  ? "Payment system is not configured. Please add your Paystack public key to the .env file."
                  : error}
              </p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isLoading || isKeyMissing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : isKeyMissing ? (
              <span>Payment Not Configured</span>
            ) : (
              <span>Pay {formatAmount(amount)}</span>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
};
