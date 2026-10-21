"use client";

import { UserAuthWrapper } from "@/features/auth/UserAuthWrapper";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, FormSelect, PasswordInput, TextInput } from "@/components/form";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignupSchema, SignupSchemaType } from "@/types/auth/schema";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { handleAppError } from "@/lib/axios";
import { isMockMode } from "@/lib/config";
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
  // A ?ref= link credits the referrer; it replaces typing a code.
  const referralLinkId = useSearchParams().get("ref")?.trim() ?? "";
  const [isPaying, setIsPaying] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethodError, setPaymentMethodError] = useState("");

  const [departments, setDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [allExams, setAllExams] = useState<{ value: string; label: string }[]>([]);
  // Live classes belong to one department; remember which so a stale list is never shown.
  const [departmentClasses, setDepartmentClasses] = useState<{
    departmentId: string;
    options: { value: string; label: string }[];
  }>({ departmentId: "", options: [] });
  const [paymentMethods, setPaymentMethods] = useState<
    { value: string; label: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    defaultValues: {
      fullName: "",
      emailAddress: "",
      phoneNumber: "",
      department: "",
      exam: "",
      referralCode: "",
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
        setAllExams(examOptions);
        setPaymentMethods(paymentOptions);
        // Sign-up is always paid online, so there is nothing to choose between.
        if (!isMockMode() && paymentOptions.length === 1) setPaymentMethodId(paymentOptions[0].value);
      } catch {
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load dropdown data",
        });
      }
    };

    fetchData();
  }, []);

  const selectedDepartmentId = useWatch({ control, name: "department" });
  const selectedExamId = useWatch({ control, name: "exam" });

  // The live API lists classes per department, so a new department means a new list.
  useEffect(() => {
    if (isMockMode()) return;
    let current = true;
    setValue("exam", "");
    if (!selectedDepartmentId) return;
    fetchExams(selectedDepartmentId)
      .then((options) => {
        if (current) setDepartmentClasses({ departmentId: selectedDepartmentId, options });
      })
      .catch(() => {
        showToast({ variant: "error", title: "Error", message: "Failed to load classes" });
      });
    return () => {
      current = false;
    };
  }, [selectedDepartmentId, setValue]);
  const exams = isMockMode()
    ? allExams
    : departmentClasses.departmentId === selectedDepartmentId
      ? departmentClasses.options
      : [];
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
      const payload = mapSignupPayload(formData, { paymentMethodId, referralLinkId });
      const response = await signupUser(payload);
      const verificationData = getSignupVerificationData(response, payload);

      savePendingSignupVerification(verificationData);

      setShowInstructionModal(false);
      if (isMockMode()) {
        showToast({
          variant: "success",
          title: "Check your email",
          message: "Enter the verification code to continue to payment.",
        });
        router.push("/sign-up/verify-account");
      } else {
        // The live sign-up has no emailed code; payment is the next step.
        showToast({
          variant: "success",
          title: "Almost there",
          message: "Complete your payment to activate your account.",
        });
        router.push("/sign-up/complete-registration");
      }
      return;
    } catch (error) {
      handleAppError({ showToast: true, error });
      setIsPaying(false);
    }
  };

  return (
    <UserAuthWrapper>
      <form
        className="flex flex-col gap-5 justify-center items-start animate-fade-down"
        onSubmit={handleSubmit(handleSignup)}
        noValidate
      >
        <div className="flex flex-col gap-2">
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
            Student <span className="text-(--secondary-color)">Sign Up!</span>
          </h1>
          <p className="text-slate-700">
            Kindly provide the required information to{" "}
            <strong>create your Leaders Tutors student account.</strong>
          </p>
        </div>

        <TextInput
          id="fullName"
          autoComplete="name"
          label="Full Name"
          message={errors.fullName?.message}
          disabled={isPaying}
          {...register("fullName")}
        />

        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          label="Email Address"
          message={errors.emailAddress?.message}
          disabled={isPaying}
          {...register("emailAddress")}
        />

        <TextInput
          id="tel"
          type="tel"
          autoComplete="tel"
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

        {!referralLinkId && (
          <TextInput
            id="referralCode"
            autoComplete="off"
            label="Referral Code (Optional)"
            message={errors.referralCode?.message}
            disabled={isPaying}
            {...register("referralCode")}
          />
        )}

        <div className="w-full relative">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            label="Create Password"
            message={errors.password?.message}
            disabled={isPaying}
            {...register("password")}
          />
        </div>

        <div className="w-full relative">
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            label="Confirm Password"
            message={errors.confirmPassword?.message}
            disabled={isPaying}
            {...register("confirmPassword")}
          />
        </div>

        <Button
          type="submit"
          text="Sign-Up"
          frontIcon={<ArrowRight />}
          fullWidth
          disabled={isPaying}
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
        </div>
      </form>

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
        verifiesEmail={isMockMode()}
        onPaymentMethodChange={(value) => {
          setPaymentMethodId(value);
          setPaymentMethodError("");
        }}
        onPayNow={handlePayNow}
      />
    </UserAuthWrapper>
  );
}
