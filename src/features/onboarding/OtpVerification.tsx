"use client";
import { Button, OtpInput } from "@/components/form";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UserAuthWrapper } from "../auth/UserAuthWrapper";
import { useRouter } from "next/navigation";
import {
  readPendingSignupVerification,
  resendSignupOtp,
  verifySignupOtp,
} from "@/services/auth";
import { showToast } from "@/components/toast";
import { useCountdown } from "@/hooks/useCountdown";
import { getResendOtpCapability, isMockMode } from "@/lib/config";
import { MOCK_OTP } from "@/services/mock/directory";
import { getErrorMessage } from "@/lib/errors";

export const OtpVerification = () => {
  const router = useRouter();
  const countdown = useCountdown(30);
  const resend = getResendOtpCapability();
  const [pending] = useState(() => readPendingSignupVerification());
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pending) {
      setError("Your signup session has expired. Please start again.");
      return;
    }
    if (otp.length !== 6) {
      setError("Enter the six-digit code sent to your email.");
      return;
    }
    try {
      setIsPending(true);
      setError("");
      await verifySignupOtp({
        userId: pending.userId,
        otp: Number(otp),
        password: pending.signupPayload.password,
        confirmPassword: pending.signupPayload.confirmPassword,
      });
      showToast({ variant: "success", title: "Email verified", message: "Complete payment to activate your account." });
      router.push("/sign-up/complete-registration");
    } catch (failure) {
      setError(getErrorMessage(failure, "Verification failed. Check the code and try again."));
    } finally {
      setIsPending(false);
    }
  };

  const resendCode = async () => {
    try {
      await resendSignupOtp(pending?.userId ?? "");
      countdown.restart();
      showToast({ variant: "success", title: "Code sent", message: `A new code was sent to ${pending?.emailAddress ?? "your email"}.` });
    } catch (failure) {
      setError(getErrorMessage(failure, "We couldn't send a new code."));
    }
  };

  return (
    <UserAuthWrapper>
      <form onSubmit={handleVerifyEmail} noValidate className="flex flex-col gap-5 justify-center items-start animate-fade-up">
        <div className="flex flex-col gap-1">
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
            Verify your{" "}
            <span className="text-(--secondary-color)">account</span>
          </h1>
          <p className="text-slate-700">
            Enter the verification code sent to your email address{" "}
            <span className="font-medium-custom text-(--primary-color)">
              {pending?.emailAddress || "your email address"}
            </span>
          </p>
          {isMockMode() && <p className="text-sm text-slate-600">Demo code: {MOCK_OTP}</p>}
        </div>

        <OtpInput value={otp} onChange={setOtp} disabled={isPending} invalid={Boolean(error)} describedBy={error ? "otp-error" : undefined} />
        {error && (
          <p id="otp-error" role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {!resend.available ? (
          <p className="text-sm text-slate-600">{resend.reason}</p>
        ) : !countdown.done ? (
          <p className="text-sm text-slate-600">
            Don&apos;t see it? You can request a new code in 00:{String(countdown.remaining).padStart(2, "0")}
          </p>
        ) : (
          <button type="button" onClick={() => void resendCode()} className="text-sm font-semibold text-(--primary-color) hover:underline">
            Resend code
          </button>
        )}

        <Button
          type="submit"
          text="Proceed"
          frontIcon={<ArrowRight />}
          fullWidth
          isLoading={isPending}
        />
        <p className="text-sm text-(--text-color)">
          Already have an account?{" "}
          <Link
            className="text-(--primary-color) font-medium-custom hover:underline"
            href="/login"
          >
            Login Here
          </Link>
        </p>
      </form>
    </UserAuthWrapper>
  );
};
