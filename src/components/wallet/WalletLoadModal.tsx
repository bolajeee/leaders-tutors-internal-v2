"use client";
import { useState } from "react";
import { CheckCircle2, Clock, CreditCard, Wallet } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
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
import { useRefreshAccount } from "@/hooks/usePortalData";
import { getErrorMessage } from "@/lib/errors";

interface WalletLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MIN_WALLET_LOAD = 100;

type Outcome =
  | { kind: "idle" }
  | { kind: "success"; amount: number }
  | { kind: "cancelled" }
  | { kind: "pending" };

export default function WalletLoadModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletLoadModalProps) {
  const user = useAuthStore((state) => state.user);
  const refreshAccount = useRefreshAccount();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  const reset = () => {
    setAmount("");
    setError("");
    setOutcome({ kind: "idle" });
    setIsLoading(false);
  };

  const close = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < MIN_WALLET_LOAD) {
      setError(`Minimum amount is ₦${MIN_WALLET_LOAD}`);
      return;
    }

    const email = user?.email;
    if (!email) {
      setError("We couldn't find your email address. Please sign in again.");
      return;
    }

    let transactionId = "";
    try {
      setIsLoading(true);
      setError("");

      const payment = await initiateWalletLoad(numAmount);
      transactionId = payment.transactionId;
      const publicKey = payment.paystackPaymentKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
      if (!publicKey) {
        await cancelWalletLoad(transactionId);
        setError("Paystack is not configured for this environment.");
        setIsLoading(false);
        return;
      }

      await loadPaystackScript();
      initializePaystackPayment({
        publicKey,
        email,
        amount: convertToKobo(numAmount),
        label: "Load wallet",
        metadata: { transactionId, purpose: "load_wallet" },
        onSuccess: (reference) => {
          void (async () => {
            const confirmed = await confirmWalletLoadSuccess(transactionId || reference);
            setIsLoading(false);
            await refreshAccount();
            if (!confirmed) {
              setError(
                "Payment received but we couldn't update your wallet yet. Please refresh shortly or contact support.",
              );
              return;
            }
            setOutcome({ kind: "success", amount: numAmount });
            onSuccess();
          })();
        },
        onClose: () => {
          void (async () => {
            await cancelWalletLoad(transactionId);
            await refreshAccount();
            setIsLoading(false);
            setOutcome({ kind: "cancelled" });
          })();
        },
        onPending: () => {
          void refreshAccount();
          setIsLoading(false);
          setOutcome({ kind: "pending" });
        },
      });
    } catch (failure) {
      setError(getErrorMessage(failure, "Failed to start payment. Please try again."));
      setIsLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="Load wallet"
      onClose={close}
      closeLabel="Close wallet dialog"
      dismissible={!isLoading}
      icon={<Wallet className="h-5 w-5" />}
    >
      {outcome.kind === "success" ? (
        <div className="p-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
          <h3 className="mt-4 text-xl font-semibold text-slate-900">Wallet loaded</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ₦{outcome.amount.toLocaleString()} has been added to your wallet.
          </p>
          <button type="button" onClick={close} className="mt-6 min-h-11 w-full rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-white">
            Done
          </button>
        </div>
      ) : outcome.kind === "pending" ? (
        <div className="p-6 text-center" role="status">
          <Clock className="mx-auto h-12 w-12 text-amber-600" aria-hidden />
          <h3 className="mt-4 text-xl font-semibold text-slate-900">Payment pending</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We will credit your wallet once the payment is confirmed. You can follow it in your transaction history.
          </p>
          <button type="button" onClick={close} className="mt-6 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6" noValidate>
          {outcome.kind === "cancelled" && (
            <p role="status" className="mb-4 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">
              Payment was cancelled and no money was taken. Enter an amount to try again.
            </p>
          )}
          <div className="mb-6">
            <label htmlFor="wallet-amount" className="mb-2 block text-sm font-semibold text-slate-800">
              Amount (₦)
            </label>
            <input
              id="wallet-amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              min={MIN_WALLET_LOAD}
              step={100}
              aria-describedby="wallet-amount-hint"
              aria-invalid={Boolean(error)}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-lg outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color-light)]"
            />
            <p id="wallet-amount-hint" className="mt-1 text-xs text-slate-600">
              Minimum amount: ₦{MIN_WALLET_LOAD}
            </p>
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <fieldset className="mb-6">
            <legend className="mb-3 text-sm font-semibold text-slate-800">Quick select</legend>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 5000, 10000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  className="min-h-11 rounded-lg border border-slate-200 text-sm font-semibold hover:border-[var(--primary-color)] hover:bg-indigo-50"
                >
                  ₦{quickAmount.toLocaleString()}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mb-6 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <CreditCard className="h-5 w-5 text-slate-500" aria-hidden />
            <span className="text-sm text-slate-700">Card payment (Paystack)</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={close}
              disabled={isLoading}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 flex-1 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Processing…" : "Continue to payment"}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
