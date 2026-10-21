"use client";
import { useState } from "react";
import { X, CreditCard, Wallet } from "lucide-react";
import { Button, TextInput } from "@/components/form";
import {
  initiateWalletLoad,
  confirmWalletLoadSuccess,
  cancelWalletLoad,
} from "@/services/payment";
import {
  loadPaystackScript,
  initializePaystackPayment,
  convertToKobo,
} from "@/services/paystack";
import { useAuthStore } from "@/store/authStore";

interface WalletLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletLoadModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletLoadModalProps) {
  const user = useAuthStore((state) => state.user);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      setError("Minimum amount is ₦100");
      return;
    }

    const publicKeyFallback = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
    const email = user?.email;
    if (!email) {
      setError("We couldn't find your email address. Please sign in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const payment = await initiateWalletLoad(numAmount);
      const publicKey = payment.paystackPaymentKey || publicKeyFallback;
      if (!publicKey) {
        await cancelWalletLoad(payment.transactionId);
        setError("Paystack is not configured for this environment.");
        setIsLoading(false);
        return;
      }

      await loadPaystackScript();
      initializePaystackPayment({
        publicKey,
        email,
        amount: convertToKobo(numAmount),
        metadata: {
          transactionId: payment.transactionId,
          purpose: "load_wallet",
        },
        onSuccess: (reference) => {
          void (async () => {
            const confirmed = await confirmWalletLoadSuccess(
              payment.transactionId || reference,
            );
            setIsLoading(false);
            if (!confirmed) {
              setError(
                "Payment received but we couldn't update your wallet yet. Please refresh shortly or contact support.",
              );
              return;
            }
            setAmount("");
            onSuccess();
            onClose();
          })();
        },
        onClose: () => {
          void cancelWalletLoad(payment.transactionId);
          setIsLoading(false);
        },
      });
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Load Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (₦)
            </label>
            <TextInput
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="100"
              step="100"
              required
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum amount: ₦100</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Quick Select
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 5000, 10000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-semibold"
                >
                  ₦{quickAmount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Payment Method
            </p>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">
                Card Payment (Paystack)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              text="Cancel"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              text={isLoading ? "Processing..." : "Continue to Payment"}
              className="flex-1"
              disabled={isLoading || !amount}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
