import { zodResolver } from "@hookform/resolvers/zod";
import { Button, PasswordInput, TextInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { AuthLoginSchema, AuthLoginType } from "@/types/auth/schema";
import { AlertCircle, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useState } from "react";
import { showToast } from "@/components/toast";
import { useAuthStore } from "@/store/authStore";
import { loginUser, normalizeAuthResponse } from "@/services/auth";
import { isMockMode, safeNextPath } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

interface AuthFormStepsProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
}

export const DEMO_ACCOUNTS = {
  active: { email: "student@leaderstutors.com", password: "demo-password" },
  expired: { email: "expired.student@leaderstutors.com", password: "demo-password" },
} as const;

export const Auth: React.FC<AuthFormStepsProps> = (props) => {
  const { gotoAuthFormPage } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session-expired";
  const nextPath = safeNextPath(searchParams.get("next"));
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthLoginType>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(AuthLoginSchema),
    mode: "onChange",
  });

  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      setIsPending(true);
      setFormError("");

      const response = await loginUser({
        emailAddress: credentials.email,
        password: credentials.password,
      });
      const { token, user } = normalizeAuthResponse(response, credentials.email);

      useAuthStore.getState().setAuth(user, token);

      // Persist enrollment so the portal knows the student's class immediately.
      if (user.departmentId && user.examId) {
        useAuthStore.getState().setUserEnrollment({
          departmentId: user.departmentId,
          departmentName: user.departmentName ?? "",
          examId: user.examId,
          examAbbreviation: user.examAbbreviation ?? "",
          status: "active",
        });
      }

      showToast({
        variant: "success",
        title: "Login successful",
        message: "Your account is ready.",
      });
      router.push(nextPath);
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn't sign you in. Please try again."));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <form
        className="flex flex-col gap-5 justify-center items-start animate-fade-up"
        onSubmit={handleSubmit(signIn)}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Link href="/" className="w-50" aria-label="Leaders Tutors home">
            <Image
              src="/body-pix/logo.png"
              alt="Leaders Tutors"
              className="w-full h-auto"
              width={0}
              height={0}
              unoptimized
            />
          </Link>
          <h1 className="text-2xl text-[#1F2937] font-bold-custom">
            Welcome <span className="text-(--secondary-color)">Back!</span>
          </h1>
          <p className="text-(--text-color) text-[16px]">
            Please enter your details to login to your{" "}
            <strong>Leaders Tutors Student Learning</strong> portal
          </p>
        </div>

        {sessionExpired && (
          <p role="status" className="flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            Your session has expired. Please sign in again to continue.
          </p>
        )}
        {formError && (
          <p role="alert" className="flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
            <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </p>
        )}

        <TextInput
          id="email"
          type="email"
          autoComplete="username"
          label="Email address"
          message={errors.email?.message}
          disabled={isPending}
          {...register("email")}
        />
        <PasswordInput
          id="password"
          label="Password"
          autoComplete="current-password"
          message={errors.password?.message}
          disabled={isPending}
          {...register("password")}
        />
        <p className="text-sm text-(--text-color)">
          Forgot Password?{" "}
          <button
            type="button"
            className="text-(--primary-color) font-medium-custom hover:underline"
            onClick={() => gotoAuthFormPage("resetPassword")}
          >
            Reset Password Here
          </button>
        </p>

        <Button
          type="submit"
          text="Login"
          frontIcon={<ArrowRight />}
          fullWidth
          isLoading={isPending}
        />

        {isMockMode() && (
          <fieldset className="w-full rounded-xl border border-dashed border-slate-300 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Local demo
            </legend>
            <p className="mb-3 text-xs leading-5 text-slate-600">
              Sample data only. No credentials needed.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => void signIn(DEMO_ACCOUNTS.active)}
                className="min-h-11 rounded-xl border border-(--primary-color) px-3 text-sm font-semibold text-(--primary-color) transition hover:bg-indigo-50 disabled:opacity-50"
              >
                Explore the local demo
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => void signIn(DEMO_ACCOUNTS.expired)}
                className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Demo with expired plan
              </button>
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-4 items-center justify-center w-full pt-4 border-t border-gray-300">
          <p className="text-sm text-(--text-color)">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-(--primary-color) font-medium-custom hover:underline"
            >
              Sign Up Here
            </Link>
          </p>
        </div>
      </form>
    </>
  );
};
