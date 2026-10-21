"use client";
import { useState } from "react";
import { AUTH_PAGES } from "@/constants/auth";
import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { Auth } from "./Auth";
import { AuthFormStepsType } from "@/types/auth/auth";
import { ResetPassword } from "./ResetPassword";
import { VerifyAccount } from "./VerifyAccount";
import { CreatePassword } from "./CreatePassword";
import { LoadingScreen } from "@/components/general-components/compnents";

export default function Login() {
  const [nextPage, setNextPage] = useState<AuthFormStepsType>(AUTH_PAGES.LOGIN);
  const [isLoggedOut] = useState(true);

  const gotoAuthFormPage = (stepKey: AuthFormStepsType) => {
    setNextPage(stepKey);
  };

  if (!isLoggedOut) {
    return <LoadingScreen />;
  }

  return (
    <UserAuthWrapper>
      {nextPage === AUTH_PAGES.LOGIN && (
        <Auth gotoAuthFormPage={gotoAuthFormPage} />
      )}
      {nextPage === AUTH_PAGES.RESET_PASSWORD && (
        <ResetPassword gotoAuthFormPage={gotoAuthFormPage} />
      )}
      {nextPage === AUTH_PAGES.VERIFY_ACCOUNT && (
        <VerifyAccount gotoAuthFormPage={gotoAuthFormPage} />
      )}
      {nextPage === AUTH_PAGES.CREATE_PASSWORD && (
        <CreatePassword gotoAuthFormPage={gotoAuthFormPage} />
      )}
    </UserAuthWrapper>
  );
}
