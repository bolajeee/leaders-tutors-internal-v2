import { AuthResponse } from "@/types/auth/auth";
import type { AccountSnapshot } from "@/types/portal";
import {
  getRecoveryCapability,
  getResendOtpCapability,
  isMockMode,
  SUBSCRIPTION_PRICE,
} from "@/lib/config";
import { ApiError, FeatureUnavailableError } from "@/lib/errors";
import { liveCall } from "@/lib/live-api";
import {
  getNameParts,
  isLiveSession,
  parseLiveSession,
} from "@/services/live-account";
import {
  labelFor,
  MOCK_OTP,
  MOCK_TAKEN_EMAIL,
  MOCK_WRONG_PASSWORD,
  mockDepartments,
  mockExams,
  mockPaymentMethods,
  type DropdownOption,
} from "@/services/mock/directory";
import { useDemoStore, scenarioForEmail } from "@/services/mock/demoStore";

export const PENDING_SIGNUP_EMAIL_STORAGE_KEY = "leaders-tutors-signup-email";
export const PENDING_SIGNUP_VERIFICATION_STORAGE_KEY =
  "leaders-tutors-pending-signup";

interface LoginPayload {
  emailAddress: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  departmentId: string;
  examId: string;
  password: string;
  confirmPassword: string;
  paymentMethodId?: string;
  /** An agent's code typed at sign-up, or the id from a ?ref= link. */
  referral?: { type: "code" | "link"; id: string };
}

export interface VerifySignupOtpPayload {
  userId: string;
  otp: number;
  password: string;
  confirmPassword: string;
}

export interface PendingSignupVerification {
  userId: string;
  emailAddress: string;
  signupPayload: SignupPayload;
  paymentProceedData?: {
    fullName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    transactionId?: string;
    paymentMethodId?: string;
    currency?: string;
    amount?: string | number;
    email?: string;
    paystackPaymentKey?: string;
    /** Live sign-up only: the new account's key, used to confirm or cancel payment. */
    accessKey?: string;
    subscriptionId?: string;
    referralType?: string;
    referralId?: string;
  };
}

type AuthApiResponse = Record<string, unknown>;

interface Department {
  department_id: string;
  department_name: string;
}

interface SchoolClass {
  class_id: string;
  class_name: string;
}

interface PaymentMethod {
  payment_method_id: string;
  payment_method_name: string;
}

/** Sign-up can only be paid online; wallet and system methods need an existing account. */
const SIGNUP_PAYMENT_METHODS = ["DO"];

export const fetchDepartments = async (): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockDepartments;
  const { data } = await liveCall<{ data: Department[] }>("/site/departments/fetch-department", {
    department_id: "",
  });
  return (data ?? []).map((item) => ({
    value: item.department_id,
    label: item.department_name,
  }));
};

/** A student's class. The live API lists classes per department, so one is required there. */
export const fetchExams = async (departmentId?: string): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockExams;
  if (!departmentId) return [];
  const { data } = await liveCall<{ data: SchoolClass[] }>("/site/department-class-subject/fetch-class-by-department", {
    department_id: departmentId,
  });
  return (data ?? []).map((item) => ({
    value: item.class_id,
    label: item.class_name,
  }));
};

export const fetchPaymentMethods = async (): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockPaymentMethods;
  const { data } = await liveCall<{ data: PaymentMethod[] }>("/setups/payment-method", { payment_id: "" });
  return (data ?? [])
    .filter((item) => SIGNUP_PAYMENT_METHODS.includes(item.payment_method_id))
    .map((item) => ({
      value: item.payment_method_id,
      label: item.payment_method_name,
    }));
};

const getStringValue = (
  source: AuthApiResponse,
  keys: string[],
  fallback = "",
) => {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
    // Ids such as userId may arrive as numbers.
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
};

export const mapSignupPayload = (
  formData: {
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    department: string;
    exam: string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
  },
  extras: { paymentMethodId: string; referralLinkId?: string },
): SignupPayload => {
  const referralId = (extras.referralLinkId || formData.referralCode || "").trim();
  return {
    fullName: formData.fullName.trim(),
    emailAddress: formData.emailAddress.trim(),
    phoneNumber: formData.phoneNumber.trim(),
    departmentId: formData.department.trim(),
    examId: formData.exam.trim(),
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    paymentMethodId: extras.paymentMethodId,
    referral: referralId
      ? { type: extras.referralLinkId ? "link" : "code", id: referralId }
      : undefined,
  };
};

/* -------------------------------------------------------------------------- */
/*  Mock backend (NEXT_PUBLIC_CURRICULUM_SOURCE=mock)                         */
/* -------------------------------------------------------------------------- */

const titleCase = (value: string) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

const nameFromEmail = (email: string) =>
  titleCase(
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\d+/g, "")
      .trim() || "Student",
  );

const mockSession = (profile: {
  emailAddress: string;
  fullName: string;
  phoneNumber?: string;
  departmentId?: string;
  examId?: string;
}): AuthApiResponse => {
  const departmentId = profile.departmentId ?? "basic";
  const examId = profile.examId ?? "basic-5";
  return {
    accessKey: `mock-session-${Math.random().toString(36).slice(2, 10)}`,
    userId: `demo-${profile.emailAddress}`,
    emailAddress: profile.emailAddress,
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber ?? "",
    departmentId,
    departmentName: labelFor(mockDepartments, departmentId, "Basic School"),
    examId,
    examAbbreviation: labelFor(mockExams, examId, "Basic 5"),
    role: "Student",
    status: "Active",
  };
};

const mockLogin = (payload: LoginPayload): AuthApiResponse => {
  if (payload.password === MOCK_WRONG_PASSWORD) {
    throw new ApiError("Invalid email or password.", 401);
  }
  const email = payload.emailAddress.trim().toLowerCase();
  useDemoStore.getState().ensureAccount(email);
  return mockSession({
    emailAddress: email,
    fullName: scenarioForEmail(email) === "expired" ? "Expired Student" : nameFromEmail(email),
  });
};

/* -------------------------------------------------------------------------- */
/*  Auth API                                                                  */
/* -------------------------------------------------------------------------- */

export const signupUser = async (payload: SignupPayload) => {
  if (isMockMode()) {
    if (payload.emailAddress.trim().toLowerCase() === MOCK_TAKEN_EMAIL) {
      throw new ApiError("An account with this email address already exists.", 409);
    }
    return {
      userId: `demo-${payload.emailAddress.trim().toLowerCase()}`,
      emailAddress: payload.emailAddress,
      paymentProceedData: {
        transactionId: `SIGNUP-${Date.now()}`,
        amount: SUBSCRIPTION_PRICE.amount,
        currency: "NGN",
        paystackPaymentKey: "pk_test_local_demo",
      },
    };
  }

  return liveCall("/user/auth/signup", {
    fullname: payload.fullName,
    email: payload.emailAddress,
    mobile_no: payload.phoneNumber,
    department_id: payload.departmentId,
    class_id: payload.examId,
    create_password: payload.password,
    confirm_password: payload.confirmPassword,
    referral_type: payload.referral?.type ?? "code",
    referral_id: payload.referral?.id ?? "",
  });
};

export const loginUser = async (payload: LoginPayload) => {
  if (isMockMode()) return mockLogin(payload);
  return liveCall("/user/auth/login", { username: payload.emailAddress, password: payload.password });
};

/**
 * Verifies the emailed code and sets the account password. The same proven
 * endpoint serves signup verification and password recovery.
 */
export const verifySignupOtp = async (payload: VerifySignupOtpPayload) => {
  if (isMockMode()) {
    if (String(payload.otp) !== MOCK_OTP) {
      throw new ApiError("That verification code isn't correct.", 400);
    }
    return { success: true };
  }
  return liveCall("/user/auth/create-new-password", {
    user_id: payload.userId,
    otp: payload.otp,
    password: payload.password,
    confirm_password: payload.confirmPassword,
  });
};

export const requestPasswordRecovery = async (emailAddress: string): Promise<{ userId: string }> => {
  const capability = getRecoveryCapability();
  if (!capability.available) throw new FeatureUnavailableError(capability.reason ?? "Password recovery is unavailable.");
  if (isMockMode()) return { userId: `demo-${emailAddress.trim().toLowerCase()}` };

  const response = await liveCall("/user/auth/reset-password", { email: emailAddress });
  const userId = getStringValue(response, ["user_id", "userId", "id"]);
  if (!userId) throw new Error("We couldn't start password recovery. Please try again.");
  return { userId };
};

export const resendSignupOtp = async (userId: string): Promise<void> => {
  const capability = getResendOtpCapability();
  if (!capability.available) throw new FeatureUnavailableError(capability.reason ?? "Resending codes is unavailable.");
  if (isMockMode()) return;
  await liveCall("/user/auth/resend-otp", { user_id: userId });
};

export const getSignupVerificationData = (
  response: AuthApiResponse,
  signupPayload: SignupPayload,
): PendingSignupVerification => {
  // A live sign-up reply carries the new account and its payment at the top level.
  if (response.user_id && response.transaction_id) {
    return {
      userId: getStringValue(response, ["user_id"]),
      emailAddress: getStringValue(response, ["email"], signupPayload.emailAddress),
      signupPayload,
      paymentProceedData: {
        fullName: signupPayload.fullName,
        emailAddress: signupPayload.emailAddress,
        phoneNumber: signupPayload.phoneNumber,
        transactionId: getStringValue(response, ["transaction_id"]),
        amount: getStringValue(response, ["amount"]),
        email: getStringValue(response, ["email"], signupPayload.emailAddress),
        currency: "NGN",
        paystackPaymentKey: getStringValue(response, ["paystack_payment_key"]),
        accessKey: getStringValue(response, ["access_key"]),
        subscriptionId: getStringValue(response, ["subscription_id"]),
        referralType: getStringValue(response, ["referral_type"], signupPayload.referral?.type ?? "code"),
        referralId: getStringValue(response, ["referral_id"], signupPayload.referral?.id ?? ""),
      },
    };
  }

  const responseData = response as Record<string, unknown>;
  const dataObj = responseData?.data as Record<string, unknown> | undefined;
  const userObj = responseData?.user as Record<string, unknown> | undefined;

  // The user id may sit at the top level or inside data/user depending on the API variant.
  const extractedUserId =
    getStringValue(response, ["userId", "id"]) ||
    (dataObj ? getStringValue(dataObj, ["userId", "id"]) : "") ||
    (userObj ? getStringValue(userObj, ["userId", "id"]) : "");

  const paymentProceedData = (responseData?.paymentProceedData ||
    dataObj?.paymentProceedData) as
    | PendingSignupVerification["paymentProceedData"]
    | undefined;

  return {
    userId: extractedUserId || `temp_${Date.now()}`,
    emailAddress: getStringValue(
      response,
      ["emailAddress", "email"],
      signupPayload.emailAddress,
    ),
    signupPayload,
    paymentProceedData: paymentProceedData || undefined,
  };
};

export const savePendingSignupVerification = (
  pendingSignup: PendingSignupVerification,
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    PENDING_SIGNUP_VERIFICATION_STORAGE_KEY,
    JSON.stringify(pendingSignup),
  );
  window.sessionStorage.setItem(
    PENDING_SIGNUP_EMAIL_STORAGE_KEY,
    pendingSignup.emailAddress,
  );
};

export const readPendingSignupVerification =
  (): PendingSignupVerification | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedValue = window.sessionStorage.getItem(
      PENDING_SIGNUP_VERIFICATION_STORAGE_KEY,
    );

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as PendingSignupVerification;
    } catch {
      return null;
    }
  };

export const clearPendingSignupVerification = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_SIGNUP_VERIFICATION_STORAGE_KEY);
  window.sessionStorage.removeItem(PENDING_SIGNUP_EMAIL_STORAGE_KEY);
};

type NestedRecord = Record<string, unknown> | undefined;

const optionalId = (value: unknown) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

const optionalText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const normalizeAuthResponse = (
  response: AuthApiResponse,
  fallbackEmail: string,
): { token: string; user: AuthResponse; account?: AccountSnapshot } => {
  if (isLiveSession(response)) return parseLiveSession(response, fallbackEmail);

  // Data may be nested in a `data` property depending on the API variant.
  const source = (response?.data as AuthApiResponse | undefined) || response;

  const token = getStringValue(source, ["accessKey", "accessToken", "token"]);
  if (!token) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  const fullName = getStringValue(source, ["fullName"]);
  const { firstName, lastName } = getNameParts(fullName);
  const departmentData = source.departmentData as NestedRecord;
  const examData = source.examData as NestedRecord;

  return {
    token,
    user: {
      token,
      id: getStringValue(source, ["id", "userId"], "unknown-user"),
      email: getStringValue(source, ["email", "emailAddress"], fallbackEmail),
      first_name: getStringValue(source, ["first_name", "firstName"], firstName),
      last_name: getStringValue(source, ["last_name", "lastName"], lastName),
      phone_number:
        getStringValue(source, ["phone_number", "phoneNumber"]) || null,
      last_active: getStringValue(
        source,
        ["last_active", "lastActive", "lastLoginTime"],
        new Date().toISOString(),
      ),
      role: getStringValue(source, ["role"], "User"),
      status: getStringValue(source, ["status"], "Active"),
      middle_name:
        getStringValue(source, ["middle_name", "middleName"]) || null,
      // Enrollment — the login response carries these so the app can resolve
      // the student's class without a separate call. Ids may be numbers, so they
      // are coerced to strings; values live both at top level and nested.
      departmentId: optionalId(source.departmentId ?? departmentData?.departmentId),
      departmentName: optionalText(
        departmentData?.departmentName ??
          source.departmentName ??
          source.department_name ??
          source.department,
      ),
      examId: optionalId(source.examId ?? examData?.examId),
      examAbbreviation: optionalText(
        examData?.examAbbreviation ??
          source.examAbbreviation ??
          source.examAbbr ??
          source.exam_abbreviation,
      ),
    },
  };
};

/**
 * Complete signup after successful payment. In mock mode the account is
 * created from the pending signup details and seeded with an active plan.
 */
export const completeSignupSuccess = async (
  transactionId: string,
  paymentKey: string,
): Promise<AuthApiResponse> => {
  if (isMockMode()) {
    const pending = readPendingSignupVerification();
    if (!pending) throw new ApiError("Your signup session has expired. Please start again.", 400);
    const { signupPayload } = pending;
    const email = pending.emailAddress.trim().toLowerCase();
    const demo = useDemoStore.getState();
    demo.seed(email, "active", { fresh: true });
    demo.recordTransaction({
      id: transactionId,
      amount: SUBSCRIPTION_PRICE.amount,
      currency: SUBSCRIPTION_PRICE.currency,
      status: "success",
      type: "subscription",
      createdAt: new Date().toISOString(),
      description: "Registration payment",
    });
    return {
      ...mockSession({
        emailAddress: email,
        fullName: signupPayload.fullName,
        phoneNumber: signupPayload.phoneNumber,
        departmentId: signupPayload.departmentId,
        examId: signupPayload.examId,
      }),
      transactionId,
      paymentKey,
    };
  }
  const pending = readPendingSignupVerification();
  const payment = pending?.paymentProceedData;
  if (!pending || !payment?.accessKey) {
    throw new ApiError("Your signup session has expired. Please start again.", 400);
  }
  return liveCall(
    "/user/auth/signup-complete",
    {
      user_id: pending.userId,
      email: pending.emailAddress,
      transaction_id: transactionId,
      subscription_id: payment.subscriptionId,
      amount: payment.amount,
      paystack_payment_key: paymentKey,
      referral_type: payment.referralType,
      referral_id: payment.referralId,
    },
    { token: payment.accessKey },
  );
};

/** Tells the API the student left checkout without paying, so the pending sign-up is released. */
export const cancelSignupPayment = async (): Promise<void> => {
  if (isMockMode()) return;
  const accessKey = readPendingSignupVerification()?.paymentProceedData?.accessKey;
  if (!accessKey) return;
  await liveCall("/user/auth/signup-cancelled", {}, { token: accessKey });
};
