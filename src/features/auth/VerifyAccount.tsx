"use client";

import { useState } from "react";
import { Button, OtpInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { resendSignupOtp } from "@/services/auth";
import { getResendOtpCapability, isMockMode } from "@/lib/config";
import { MOCK_OTP } from "@/services/mock/directory";
import { getErrorMessage } from "@/lib/errors";
import { showToast } from "@/components/toast";
import { useCountdown } from "@/hooks/useCountdown";

interface VerifyAccountProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
  email: string;
  userId: string;
  onVerified: (otp: string) => void;
}

export const VerifyAccount: React.FC<VerifyAccountProps> = ({ gotoAuthFormPage, email, userId, onVerified }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const countdown = useCountdown(30);
  const resend = getResendOtpCapability();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the six-digit code sent to your email.");
      return;
    }
    setError("");
    onVerified(otp);
    gotoAuthFormPage("createPassword");
  };

  const resendCode = async () => {
    try {
      await resendSignupOtp(userId);
      countdown.restart();
      showToast({ variant: "success", title: "Code sent", message: `A new code was sent to ${email}.` });
    } catch (failure) {
      setError(getErrorMessage(failure, "We couldn't send a new code."));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 justify-center items-start animate-fade-up">
      <div className="flex flex-col gap-1">
        <div className="w-20">
          <Image src="/body-pix/icon.png" alt="" className="w-full h-auto" width={0} height={0} unoptimized />
        </div>
        <h1 className="text-2xl text-[#1F2937] font-bold-custom">
          Verify your <span className="text-(--secondary-color)">account</span>
        </h1>
        <p className="text-gray-600 text-[16px]">
          Enter the verification code sent to{" "}
          <span className="font-medium-custom text-(--primary-color)">{email || "your email address"}</span>
        </p>
        {isMockMode() && <p className="text-sm text-slate-600">Demo code: {MOCK_OTP}</p>}
      </div>

      <OtpInput value={otp} onChange={setOtp} invalid={Boolean(error)} describedBy={error ? "otp-error" : undefined} />
      {error && (
        <p id="otp-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {!resend.available ? (
        <p className="text-sm text-slate-600">{resend.reason}</p>
      ) : !countdown.done ? (
        <p className="text-sm text-slate-600">
          Didn&apos;t get it? You can request a new code in 00:{String(countdown.remaining).padStart(2, "0")}
        </p>
      ) : (
        <button type="button" onClick={() => void resendCode()} className="text-sm font-semibold text-(--primary-color) hover:underline">
          Resend code
        </button>
      )}

      <Button type="submit" text="Proceed" frontIcon={<ArrowRight />} fullWidth />
      <p className="text-sm text-(--text-color)">
        Remembered it?{" "}
        <button type="button" className="text-(--primary-color) font-medium-custom hover:underline" onClick={() => gotoAuthFormPage("login")}>
          Back to login
        </button>
      </p>
    </form>
  );
};
