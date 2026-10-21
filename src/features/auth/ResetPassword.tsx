"use client";

import { useState } from "react";
import { Button, TextInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { AlertCircle, ArrowRight, Info } from "lucide-react";
import Image from "next/image";
import { requestPasswordRecovery } from "@/services/auth";
import { getRecoveryCapability } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

interface ResetPasswordProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
  onRequested: (next: { email: string; userId: string }) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ResetPassword: React.FC<ResetPasswordProps> = ({ gotoAuthFormPage, onRequested }) => {
  const capability = getRecoveryCapability();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError("Enter the email address you registered with.");
      return;
    }
    setFieldError("");
    setFormError("");
    try {
      setIsPending(true);
      const { userId } = await requestPasswordRecovery(trimmed);
      onRequested({ email: trimmed, userId });
      gotoAuthFormPage("verifyAccount");
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn't start password recovery. Please try again."));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 justify-center items-start animate-fade-up">
      <div className="flex flex-col gap-1">
        <div className="w-20">
          <Image src="/body-pix/icon.png" alt="" className="w-full h-auto" width={0} height={0} unoptimized />
        </div>
        <h1 className="text-2xl text-[#1F2937] font-bold-custom">
          Reset <span className="text-(--secondary-color)">Password</span>
        </h1>
        <p className="text-gray-600 text-[16px]">Enter your registered email address</p>
      </div>

      {!capability.available ? (
        <p role="status" className="flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          {capability.reason}
        </p>
      ) : (
        <>
          {formError && (
            <p role="alert" className="flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              {formError}
            </p>
          )}
          <TextInput
            id="recovery-email"
            type="email"
            autoComplete="email"
            label="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            message={fieldError}
            disabled={isPending}
          />
          <Button type="submit" text="Proceed" frontIcon={<ArrowRight />} fullWidth isLoading={isPending} />
        </>
      )}

      <p className="text-sm text-(--text-color)">
        Remembered it?{" "}
        <button
          type="button"
          className="text-(--primary-color) font-medium-custom hover:underline"
          onClick={() => gotoAuthFormPage("login")}
        >
          Back to login
        </button>
      </p>
    </form>
  );
};
