import { Button, TextInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
interface AuthFormStepsProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
}

export const ResetPassword: React.FC<AuthFormStepsProps> = (props) => {
  const { gotoAuthFormPage } = props;
  const login = () => {
    gotoAuthFormPage("login");
  };
  const verifyAccount = async () => {
    gotoAuthFormPage("verifyAccount");
  };
  return (
    <section className="flex flex-col gap-5 justify-center items-start animate-fade-up">
      <div className="flex flex-col gap-1">
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
        <h1 className="text-2xl text-[#1F2937] font-bold-custom">
          Reset <span className="text-[var(--secondary-color)]">Password</span>
        </h1>
        <p className="text-gray-500 text-[16px]">
          Enter your registered email address
        </p>
      </div>

      <TextInput id="username" label="Email Address" />

      {/* BUTTON */}
      <Button
        onClick={verifyAccount}
        text="Proceed"
        frontIcon={<ArrowRight />}
        fullWidth
      />
      <p className="text-sm text-[var(--text-color)]">
        Already have an account?{" "}
        <span
          className="text-[var(--primary-color)] font-medium-custom cursor-pointer hover:underline"
          onClick={login}
        >
          Login Here
        </span>
      </p>
    </section>
  );
};
