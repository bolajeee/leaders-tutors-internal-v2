import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextInput } from "@/components/form";
import { AuthFormStepsType } from "@/types/auth/auth";
import { AuthLoginSchema, AuthLoginType } from "@/types/auth/schema";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useState } from "react";
import { handleAppError } from "@/lib/axios";
import { showToast } from "@/components/toast";
import { useAuthStore } from "@/store/authStore";
import { loginUser, normalizeAuthResponse } from "@/services/auth";

interface AuthFormStepsProps {
  gotoAuthFormPage: (stepKey: AuthFormStepsType) => void;
}

export const Auth: React.FC<AuthFormStepsProps> = (props) => {
  const { gotoAuthFormPage } = props;
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
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

  const handleLogin = async (data: AuthLoginType) => {
    try {
      setIsPending(true);

      const response = await loginUser({
        emailAddress: data.email,
        password: data.password,
      });
      const { token, user } = normalizeAuthResponse(response, data.email);

      useAuthStore.getState().setAuth(user, token);

      // Persist enrollment so tutorial fetches have departmentId + examId immediately
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
      router.push("/dashboard");
    } catch (error) {
      handleAppError({ showToast: true, error });
    } finally {
      setIsPending(false);
    }
  };

  const resetPassword = async () => {
    gotoAuthFormPage("resetPassword");
  };

  const handleSignUp = () => {
    router.push("/sign-up");
  };

  const handleDemo = () => {
    const token = "local-demo-session";
    useAuthStore.getState().setAuth({
      token,
      id: "demo-student",
      email: "student@leaderstutors.com",
      first_name: "Demo",
      last_name: "Student",
      phone_number: "+234 708 701 3213",
      last_active: new Date().toISOString(),
      role: "Student",
      status: "Active",
      middle_name: null,
      departmentId: "basic",
      departmentName: "Basic",
      examId: "basic-5",
      examAbbreviation: "Basic 5",
    }, token);
    useAuthStore.getState().setUserEnrollment({ departmentId: "basic", departmentName: "Basic", examId: "basic-5", examAbbreviation: "Basic 5", status: "active" });
    router.push("/dashboard");
  };

  return (
    <>
      <section className="flex flex-col gap-5 justify-center items-start animate-fade-up">
        <div className="flex flex-col gap-2">
          <div className="w-50">
            <Image
              src="/body-pix/logo.png"
              alt="Vector"
              className="w-full h-auto"
              width={0}
              height={0}
              unoptimized
            />
          </div>
          <h1 className="text-2xl text-[#1F2937] font-bold-custom">
            Welcome <span className="text-(--secondary-color)">Back!</span>
          </h1>
          <p className="text-(--text-color) text-[16px]">
            Please enter your details to login to your{" "}
            <strong>Leaders Tutors Student Learning</strong> portal
          </p>
        </div>

        <TextInput
          id="email"
          label="Email address"
          message={errors.email?.message}
          disabled={isPending}
          {...register("email")}
        />
        <TextInput
          id="password"
          label="Password"
          type="password"
          message={errors.password?.message}
          disabled={isPending}
          {...register("password")}
        />
        <p className="text-sm text-(--text-color)">
          Forgot Password?{" "}
          <span
            className="text-(--primary-color) font-medium-custom cursor-pointer hover:underline"
            onClick={resetPassword}
          >
            Reset Password Here
          </span>
        </p>

        {/* BUTTON */}
        <Button
          text="Login"
          frontIcon={<ArrowRight />}
          fullWidth
          isLoading={isPending}
          onClick={handleSubmit(handleLogin)}
        />

        {process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api" && (
          <button type="button" onClick={handleDemo} className="min-h-12 w-full rounded-xl border border-[var(--primary-color)] px-4 text-sm font-semibold text-[var(--primary-color)] transition hover:bg-indigo-50">
            Explore the local demo
          </button>
        )}

        {/* dont have an account? sign up here */}
        <div className="flex flex-col gap-4 items-center justify-center w-full pt-4 border-t border-gray-300">
          <p className="text-sm text-(--text-color)">
            Don&apos;t have an account?{" "}
            <span
              className="text-(--primary-color) font-medium-custom cursor-pointer hover:underline"
              onClick={handleSignUp}
            >
              Sign Up Here
            </span>
          </p>
          <p className="text-sm text-(--text-color) text-center">
            By logging in to this portal, you agree to our
            <br />
            <span className="text-(--secondary-color) font-medium-custom cursor-pointer hover:underline">
              Privacy Policy
            </span>{" "}
            and{" "}
            <span className="text-(--secondary-color) font-medium-custom cursor-pointer hover:underline">
              Terms of Service
            </span>
            .
          </p>
        </div>
      </section>
    </>
  );
};
