"use client";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { Button, PasswordInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { AlertCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { verifySignupOtp } from "@/services/auth";
import { getErrorMessage } from "@/lib/errors";
import { validateNewPassword } from "@/types/auth/schema";
import type { RecoveryState } from "./Login";

interface CreatePasswordProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
  recovery: RecoveryState;
}

export const CreatePassword: React.FC<CreatePasswordProps> = ({ gotoAuthFormPage, recovery }) => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateNewPassword(password, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    try {
      setIsPending(true);
      await verifySignupOtp({
        userId: recovery.userId,
        otp: Number(recovery.otp),
        password,
        confirmPassword: confirmation,
      });
      setDone(true);
    } catch (failure) {
      setError(getErrorMessage(failure, "We couldn't reset your password. Please try again."));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 justify-center items-start animate-fade-up">
        <div className="flex flex-col gap-1">
          <div className="w-20">
            <Image src="/body-pix/icon.png" alt="" className="w-full h-auto" width={0} height={0} unoptimized />
          </div>
          <h1 className="text-2xl text-[#1F2937] font-bold-custom">
            Create <span className="text-(--secondary-color)">Password</span>
          </h1>
          <p className="text-(--text-color) text-[16px]">Enter a strong password to secure your account.</p>
        </div>

        {error && (
          <p role="alert" className="flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
            <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {error}{" "}
              <button type="button" className="font-semibold underline" onClick={() => gotoAuthFormPage("verifyAccount")}>
                Re-enter the code
              </button>
            </span>
          </p>
        )}

        <PasswordInput
          id="new-password"
          label="Create Password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
        />
        <PasswordInput
          id="confirm-new-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={isPending}
        />
        <Button type="submit" text="Reset password" frontIcon={<ArrowRight />} fullWidth isLoading={isPending} />
        <p className="text-sm text-(--text-color)">
          Remembered it?{" "}
          <button type="button" className="text-(--primary-color) font-medium-custom hover:underline" onClick={() => gotoAuthFormPage("login")}>
            Back to login
          </button>
        </p>
      </form>
      <FeedbackDialog
        variant="success"
        title="Password Reset Successful"
        text="Your password has been reset. You can now log in with your email and new password."
        btnText="Login to my account"
        loadingText="Processing..."
        onClick={() => gotoAuthFormPage("login")}
        isOpen={done}
      />
    </>
  );
};
