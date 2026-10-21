"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_PAGES } from "@/constants/auth";
import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { Auth } from "./Auth";
import { AuthFormStepsType } from "@/types/auth/auth";
import { ResetPassword } from "./ResetPassword";
import { VerifyAccount } from "./VerifyAccount";
import { CreatePassword } from "./CreatePassword";
import { LoadingScreen } from "@/components/general-components/compnents";
import { useAuthStore } from "@/store/authStore";
import { useHydrated } from "@/hooks/useHydrated";
import { safeNextPath } from "@/lib/config";

export interface RecoveryState {
  email: string;
  userId: string;
  otp: string;
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const token = useAuthStore((state) => state.token);
  const [nextPage, setNextPage] = useState<AuthFormStepsType>(AUTH_PAGES.LOGIN);
  const [recovery, setRecovery] = useState<RecoveryState>({ email: "", userId: "", otp: "" });
  const expired = searchParams.get("reason") === "session-expired";

  // A signed-in student has no reason to see the login form again.
  useEffect(() => {
    if (hydrated && token && !expired) {
      router.replace(safeNextPath(searchParams.get("next")));
    }
  }, [hydrated, token, expired, router, searchParams]);

  if (!hydrated || (token && !expired)) {
    return <LoadingScreen message="Opening your portal..." />;
  }

  return (
    <UserAuthWrapper>
      {nextPage === AUTH_PAGES.LOGIN && <Auth gotoAuthFormPage={setNextPage} />}
      {nextPage === AUTH_PAGES.RESET_PASSWORD && (
        <ResetPassword
          gotoAuthFormPage={setNextPage}
          onRequested={(next) => setRecovery((current) => ({ ...current, ...next }))}
        />
      )}
      {nextPage === AUTH_PAGES.VERIFY_ACCOUNT && (
        <VerifyAccount
          gotoAuthFormPage={setNextPage}
          email={recovery.email}
          userId={recovery.userId}
          onVerified={(otp) => setRecovery((current) => ({ ...current, otp }))}
        />
      )}
      {nextPage === AUTH_PAGES.CREATE_PASSWORD && (
        <CreatePassword gotoAuthFormPage={setNextPage} recovery={recovery} />
      )}
    </UserAuthWrapper>
  );
}
