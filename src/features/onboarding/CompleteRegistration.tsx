"use client";

import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { useRouter } from "next/navigation";
import { TextInput, FormSelect } from "@/components/form";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { showToast } from "@/components/toast";
import { useForm } from "react-hook-form";
import {
  readPendingSignupVerification,
  fetchPaymentMethods,
  completeSignupSuccess,
  normalizeAuthResponse,
  type PendingSignupVerification,
} from "@/services/auth";
import { PaystackModal } from "@/components/payment/PaystackModal";
import { useAuthStore } from "@/store/authStore";

export function CompleteRegistration() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isPending, setIsPending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [pendingData, setPendingData] =
    useState<PendingSignupVerification | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    { value: string; label: string }[]
  >([]);

  const { control, watch } = useForm({
    defaultValues: {
      paymentMethod: "",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const paymentAmount = pendingData?.paymentProceedData?.amount
    ? parseFloat(String(pendingData.paymentProceedData.amount))
    : 1000;

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
    const fetchData = async () => {
      try {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load payment methods",
        });
      }
    };

    fetchData();
  }, []);

  const handleProceed = () => {
    console.log("PROCEED clicked");
    console.log("Selected payment method:", selectedPaymentMethod);
    console.log("Pending data:", pendingData);
    console.log("Payment proceed data:", pendingData?.paymentProceedData);

    if (!selectedPaymentMethod) {
      showToast({
        variant: "error",
        title: "Payment Method Required",
        message: "Please select a payment method to proceed.",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      setShowPaymentModal(false);
      setIsPending(true);

      console.log("Payment reference from Paystack:", reference);

      const transactionId =
        pendingData?.paymentProceedData?.transactionId || reference;
      const paymentKey =
        pendingData?.paymentProceedData?.paystackPaymentKey ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        "";

      if (!transactionId || !paymentKey) {
        console.error("Missing transaction data:", {
          transactionId,
          paymentKey,
        });
        throw new Error(
          "Transaction details not found. Please try signing up again.",
        );
      }

      console.log("Calling signup-success with:", {
        transactionId,
        paymentKey,
      });

      const signupSuccessResponse = await completeSignupSuccess(
        transactionId,
        paymentKey,
      );
      console.log("Signup success response:", signupSuccessResponse);

      // Check if the response contains access token
      const responseData = signupSuccessResponse as Record<string, unknown>;
      const dataObj = responseData?.data as Record<string, unknown> | undefined;
      const accessKey = (dataObj?.accessKey || responseData?.accessKey) as
        | string
        | undefined;

      console.log("Access key found:", accessKey);
      console.log("Data object:", dataObj);

      if (accessKey && pendingData) {
        // Automatically log the user in
        console.log("Auto-login: normalizing auth response...");
        const { token, user } = normalizeAuthResponse(
          signupSuccessResponse,
          pendingData.emailAddress,
        );

        console.log("Auto-login: setting auth with token:", token);
        console.log("Auto-login: user data:", user);

        setAuth(user, token);

        // Seed enrollment from signup payload (always reliable) or login response
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

        console.log("Auto-login: redirecting to dashboard...");
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        console.log("No access key found, redirecting to login");
        // No access token, redirect to login
        showToast({
          variant: "success",
          title: "Registration Successful!",
          message: "Your account has been created. Please log in now.",
        });
        router.push("/login");
      }
    } catch (error) {
      console.error("Error in handlePaymentSuccess:", error);
      // Show success toast anyway since payment was successful
      showToast({
        variant: "success",
        title: "Registration Successful!",
        message: "Your account has been created. Please log in now.",
      });
      router.push("/login");
    } finally {
      setIsPending(false);
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    showToast({
      variant: "warning",
      title: "Payment Cancelled",
      message: "You need to complete payment to activate your account.",
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!pendingData) {
    return null;
  }

  return (
    <UserAuthWrapper>
      <section className="flex flex-col gap-5 justify-center items-start animate-fade-down">
        <div className="flex flex-col gap-2">
          <div className="w-20">
            <Image
              src="/body-pix/icon.png"
              alt="Vector"
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
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {pendingData.signupPayload?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                {pendingData.emailAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <FormSelect
            id="paymentMethod"
            name="paymentMethod"
            label="Payment Method"
            placeholder="Select Payment Method"
            control={control}
            options={paymentMethods}
            disabled={isPending}
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
            disabled={isPending}
          />
        </div>

        <div className="w-full bg-[#FFF4F4] border border-[#FFB4B4] rounded-lg p-4 flex items-start gap-3">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.6667 5L7.50004 14.1667L3.33337 10"
                stroke="#999999"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            Note: You will make payment of{" "}
            <span className="font-semibold text-[#1E3A8A]">
              ₦{paymentAmount.toLocaleString()}.00
            </span>{" "}
            to complete your registration
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleGoBack}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Go Back</span>
          </button>
          <button
            onClick={handleProceed}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[55px] text-sm sm:text-base"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <span>PROCEED</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>
        </div>
      </section>

      {pendingData && (
        <PaystackModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          email={pendingData.emailAddress}
          amount={paymentAmount}
          publicKey={pendingData.paymentProceedData?.paystackPaymentKey}
          metadata={{
            userId: pendingData.userId,
            fullName: pendingData.signupPayload?.fullName,
            referralCode: referralCode || undefined,
            paymentMethod: selectedPaymentMethod,
            transactionId: pendingData.paymentProceedData?.transactionId,
            paymentMethodId: selectedPaymentMethod,
          }}
          onSuccess={handlePaymentSuccess}
          title="Complete Registration Payment"
          description="Complete your payment to activate your account and access all features."
        />
      )}
    </UserAuthWrapper>
  );
}
