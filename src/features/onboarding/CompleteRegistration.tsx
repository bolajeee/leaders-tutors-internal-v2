"use client";

import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { useRouter } from "next/navigation";
import { TextInput, FormSelect } from "@/components/form";
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { showToast } from "@/components/toast";
import { useForm } from "react-hook-form";
import {
  readPendingSignupVerification,
  clearPendingSignupVerification,
  fetchPaymentMethods,
  completeSignupSuccess,
  cancelSignupPayment,
  normalizeAuthResponse,
  type PendingSignupVerification,
} from "@/services/auth";
import { isLiveSession } from "@/services/live-account";
import { PaystackModal } from "@/components/payment/PaystackModal";
import { useAuthStore } from "@/store/authStore";
import { isMockMode, SUBSCRIPTION_PRICE } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

/** Where the payment step stands; everything except "idle" explains itself on screen. */
export type PaymentState =
  | { kind: "idle" }
  | { kind: "cancelled" }
  | { kind: "pending"; reference: string }
  | { kind: "activating" }
  | { kind: "error"; message: string; reference: string };

export function CompleteRegistration() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [payment, setPayment] = useState<PaymentState>({ kind: "idle" });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [pendingData, setPendingData] =
    useState<PendingSignupVerification | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    { value: string; label: string }[]
  >([]);
  const [methodError, setMethodError] = useState("");

  const { control, watch } = useForm({
    defaultValues: {
      paymentMethod: "",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const paymentAmount = pendingData?.paymentProceedData?.amount
    ? parseFloat(String(pendingData.paymentProceedData.amount))
    : SUBSCRIPTION_PRICE.amount;
  const busy = payment.kind === "activating";

  useEffect(() => {
    const data = readPendingSignupVerification();
    if (!data) {
      showToast({
        variant: "error",
        title: "Session Expired",
        message: "Please start the signup process again.",
      });
      router.push("/sign-up");
      return;
    }
    setPendingData(data);
  }, [router]);

  useEffect(() => {
    // Only the demo asks which method to use; live sign-up is always paid online.
    if (!isMockMode()) return;
    const fetchData = async () => {
      try {
        setPaymentMethods(await fetchPaymentMethods());
      } catch {
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load payment methods",
        });
      }
    };

    fetchData();
  }, []);

  // Live sign-up is always paid online, and the referral was entered with the sign-up form.
  const choosesMethod = isMockMode();

  const handleProceed = () => {
    if (choosesMethod && !selectedPaymentMethod) {
      setMethodError("Please select a payment method to proceed.");
      return;
    }
    setMethodError("");
    setPayment({ kind: "idle" });
    setShowPaymentModal(true);
  };

  /** Confirms the payment with the API, then signs the student in. */
  const activateAccount = async (reference: string) => {
    if (!pendingData) return;
    setShowPaymentModal(false);
    setPayment({ kind: "activating" });

    try {
      const transactionId =
        pendingData.paymentProceedData?.transactionId || reference;
      const paymentKey =
        pendingData.paymentProceedData?.paystackPaymentKey ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        "";

      if (!transactionId || !paymentKey) {
        throw new Error(
          "We couldn't find your payment details. Please start the sign-up again.",
        );
      }

      const response = await completeSignupSuccess(transactionId, paymentKey);
      const data = response?.data as Record<string, unknown> | undefined;
      const accessKey = (data?.accessKey || response?.accessKey) as
        | string
        | undefined;

      clearPendingSignupVerification();

      if (accessKey || isLiveSession(response)) {
        // Payment confirmed and a session was issued: sign the student in.
        const { token, user, account } = normalizeAuthResponse(
          response,
          pendingData.emailAddress,
        );
        setAuth(user, token, account);

        const deptId =
          pendingData.signupPayload?.departmentId || user.departmentId || "";
        const examId = pendingData.signupPayload?.examId || user.examId || "";
        if (deptId && examId) {
          useAuthStore.getState().setUserEnrollment({
            departmentId: deptId,
            departmentName: user.departmentName ?? "",
            examId,
            examAbbreviation: user.examAbbreviation ?? "",
            status: "active",
          });
        }

        showToast({
          variant: "success",
          title: "Welcome!",
          message: "Registration successful. You are now logged in.",
        });
        router.push("/dashboard");
      } else {
        showToast({
          variant: "success",
          title: "Registration Successful!",
          message: "Your account is active. Please log in now.",
        });
        router.push("/login");
      }
    } catch (error) {
      // Never report success when activation failed: keep the reference so the
      // student can retry without paying again.
      setPayment({
        kind: "error",
        reference,
        message: getErrorMessage(
          error,
          "We couldn't activate your account yet.",
        ),
      });
    }
  };

  const handlePaymentCancelled = () => {
    setShowPaymentModal(false);
    setPayment({ kind: "cancelled" });
    // Best effort: tell the API so it can release the pending sign-up.
    void cancelSignupPayment().catch(() => undefined);
  };

  const handlePaymentPending = (reference: string) => {
    setShowPaymentModal(false);
    setPayment({ kind: "pending", reference });
  };

  if (!pendingData) {
    return null;
  }

  const retryReference =
    payment.kind === "pending" || payment.kind === "error"
      ? payment.reference
      : "";

  return (
    <UserAuthWrapper>
      <section className="flex flex-col gap-5 justify-center items-start animate-fade-down">
        <div className="flex flex-col gap-2">
          <div className="w-20">
            <Image
              src="/body-pix/icon.png"
              alt=""
              className="w-full h-auto"
              width={0}
              height={0}
              unoptimized
            />
          </div>
          <h1 className="text-2xl text-(title-color) font-bold-custom">
            Complete Your{" "}
            <span className="text-(--secondary-color)">Registration</span>
          </h1>
        </div>

        <div className="w-full bg-[#F5F7FA] rounded-lg p-4 space-y-3 border border-gray-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {pendingData.signupPayload?.fullName}
              </p>
              <p className="text-sm text-gray-700">
                {pendingData.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {payment.kind === "cancelled" && (
          <p role="status" className="flex w-full items-start gap-2 rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm leading-6 text-slate-800">
            <XCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            Payment was cancelled and no money was taken. Your details are saved, so you can try again.
          </p>
        )}
        {payment.kind === "pending" && (
          <div role="status" className="flex w-full flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            <p className="flex items-start gap-2">
              <Clock className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              Your payment is being confirmed. Once it is, check the status below to activate your account.
            </p>
            <button
              type="button"
              onClick={() => void activateAccount(retryReference)}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-amber-900 px-4 font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Check payment status
            </button>
          </div>
        )}
        {payment.kind === "error" && (
          <div role="alert" className="flex w-full flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {payment.message} If you have already paid, retry activation — you won&apos;t be charged again.
              </span>
            </p>
            <button
              type="button"
              onClick={() => void activateAccount(retryReference)}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-red-800 px-4 font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Retry activation
            </button>
          </div>
        )}

        {choosesMethod && (
          <>
            <div className="w-full">
              <FormSelect
                id="paymentMethod"
                name="paymentMethod"
                label="Payment Method"
                placeholder="Select Payment Method"
                control={control}
                options={paymentMethods}
                disabled={busy}
                message={methodError}
              />
            </div>

            <div className="w-full">
              <TextInput
                id="referralCode"
                type="text"
                label="Referral Code (Optional)"
                placeholder="Enter your referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={busy}
              />
            </div>
          </>
        )}

        <div className="w-full bg-[#FFF4F4] border border-[#FFB4B4] rounded-lg p-4 flex items-start gap-3">
          <p className="text-sm text-gray-700">
            Note: You will make payment of{" "}
            <span className="font-semibold text-[#1E3A8A]">
              ₦{paymentAmount.toLocaleString()}.00
            </span>{" "}
            to complete your registration
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={busy}
            aria-label="Go back"
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Go Back</span>
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[55px] text-sm sm:text-base"
          >
            {busy ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden />
                <span>Activating your account…</span>
              </>
            ) : (
              <>
                <span>{payment.kind === "idle" ? "PROCEED" : "TRY PAYMENT AGAIN"}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </section>

      <PaystackModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onCancelled={handlePaymentCancelled}
        onPending={handlePaymentPending}
        email={pendingData.emailAddress}
        amount={paymentAmount}
        publicKey={pendingData.paymentProceedData?.paystackPaymentKey}
        reference={pendingData.paymentProceedData?.transactionId}
        metadata={{
          userId: pendingData.userId,
          fullName: pendingData.signupPayload?.fullName,
          referralCode: referralCode || undefined,
          paymentMethod: selectedPaymentMethod,
          transactionId: pendingData.paymentProceedData?.transactionId,
          paymentMethodId: selectedPaymentMethod,
        }}
        onSuccess={(reference) => void activateAccount(reference)}
        title="Complete Registration Payment"
        description="Complete your payment to activate your account and access all features."
      />
    </UserAuthWrapper>
  );
}
