"use client";

import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { useRouter } from "next/navigation";
import { Button, FormSelect, TextInput } from "@/components/form";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignupSchema, SignupSchemaType } from "@/types/auth/schema";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { handleAppError } from "@/lib/axios";
import { showToast } from "@/components/toast";
import {
  mapSignupPayload,
  signupUser,
  fetchDepartments,
  fetchExams,
  fetchPaymentMethods,
  getSignupVerificationData,
  savePendingSignupVerification,
} from "@/services/auth";
import SignupInstructionModal from "@/components/onboarding/SignupInstructionModal";

const DEFAULT_SIGNUP_AMOUNT = 1000;

export default function SignUp() {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethodError, setPaymentMethodError] = useState("");

  const [departments, setDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [exams, setExams] = useState<{ value: string; label: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    { value: string; label: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    defaultValues: {
      fullName: "",
      emailAddress: "",
      phoneNumber: "",
      department: "",
      exam: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(SignupSchema) as Resolver<SignupSchemaType>,
    mode: "onChange",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptOptions, examOptions, paymentOptions] = await Promise.all([
          fetchDepartments(),
          fetchExams(),
          fetchPaymentMethods(),
        ]);

        setDepartments(deptOptions);
        setExams(examOptions);
        setPaymentMethods(paymentOptions);
      } catch (error) {
        console.error(error);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load dropdown data",
        });
      }
    };

    fetchData();
  }, []);

  const selectedDepartmentId = watch("department");
  const selectedExamId = watch("exam");
  const selectedDepartment =
    departments.find((item) => item.value === selectedDepartmentId)?.label ||
    "";
  const selectedExam =
    exams.find((item) => item.value === selectedExamId)?.label || "";
  const paymentAmount = DEFAULT_SIGNUP_AMOUNT;

  const handleSignup = () => {
    setShowInstructionModal(true);
  };

  const handlePayNow = async () => {
    if (!paymentMethodId) {
      setPaymentMethodError("Please select a payment method to proceed.");
      return;
    }
    setPaymentMethodError("");

    try {
      setIsPaying(true);
      const formData = getValues();
      const payload = mapSignupPayload(formData, { paymentMethodId });
      const response = await signupUser(payload);
      const verificationData = getSignupVerificationData(response, payload);

      savePendingSignupVerification(verificationData);

      setShowInstructionModal(false);
      showToast({
        variant: "success",
        title: "Check your email",
        message: "Enter the verification code to continue to payment.",
      });
      router.push("/sign-up/verify-account");
      return;
    } catch (error) {
      handleAppError({ showToast: true, error });
      setIsPaying(false);
    }
  };

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
            Student <span className="text-(--secondary-color)">Sign Up!</span>
          </h1>
          <p>
            Kindly provide the required information to{" "}
            <strong>create your Leaders Tutors student account.</strong>
          </p>
        </div>

        <TextInput
          id="text"
          label="Full Name"
          message={errors.fullName?.message}
          disabled={isPaying}
          {...register("fullName")}
        />

        <TextInput
          id="email"
          label="Email Address"
          message={errors.emailAddress?.message}
          disabled={isPaying}
          {...register("emailAddress")}
        />

        <TextInput
          id="tel"
          label="Mobile Number"
          message={errors.phoneNumber?.message}
          disabled={isPaying}
          {...register("phoneNumber")}
        />

        <div className="w-full">
          {/* ✅ Department */}
          <FormSelect
            id="department"
            label="Department"
            placeholder="Select Here"
            {...register("department", { required: true })}
            control={control}
            message={errors.department?.message}
            options={departments}
            disabled={isPaying}
          />
        </div>

        {/* ✅ Exam */}
        <FormSelect
          id="exam"
          label="Select Class"
          placeholder="Select Here"
          {...register("exam", { required: true })}
          control={control}
          message={errors.exam?.message}
          options={exams}
          disabled={isPaying}
        />

        <div className="w-full relative">
          <TextInput
            id="password"
            type="password"
            label="Create Password"
            message={errors.password?.message}
            disabled={isPaying}
            {...register("password")}
          />
        </div>

        <div className="w-full relative">
          <TextInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            message={errors.confirmPassword?.message}
            disabled={isPaying}
            {...register("confirmPassword")}
          />
        </div>

        <Button
          text="Sign-Up"
          frontIcon={<ArrowRight />}
          fullWidth
          disabled={isPaying}
          onClick={handleSubmit(handleSignup)}
        />

        <div className="flex flex-col gap-4 items-center justify-center w-full pt-4 border-t border-gray-300">
          <p className="text-sm text-(--text-color)">
            Already have an account?{" "}
            <Link
              className="text-(--primary-color) font-medium-custom cursor-pointer hover:underline"
              href="/login"
            >
              Login Here
            </Link>
          </p>
          <p className="text-sm text-(--text-color) text-center">
            By signing up to this portal, you agree to our
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

      <SignupInstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        department={selectedDepartment}
        exam={selectedExam}
        amount={paymentAmount}
        isPaying={isPaying}
        paymentMethodId={paymentMethodId}
        paymentMethodOptions={paymentMethods}
        paymentMethodError={paymentMethodError}
        onPaymentMethodChange={(value) => {
          setPaymentMethodId(value);
          setPaymentMethodError("");
        }}
        onPayNow={handlePayNow}
      />
    </UserAuthWrapper>
  );
}
