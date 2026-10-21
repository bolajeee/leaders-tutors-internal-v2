import { apiClient } from "@/lib/api-client";
import { AuthResponse } from "@/types/auth/auth";
import {
  getEndpoints,
  getRecoveryCapability,
  getResendOtpCapability,
  isMockMode,
  SUBSCRIPTION_PRICE,
} from "@/lib/config";
import { ApiError, FeatureUnavailableError } from "@/lib/errors";
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
  };
}

type AuthApiResponse = Record<string, unknown>;

interface Department {
  departmentId: number;
  departmentName: string;
}

interface Exam {
  examId: string | number;
  examAbbreviation: string;
}

const toList = <T>(data: T[] | { data?: T[] } | undefined): T[] =>
  Array.isArray(data) ? data : data?.data || [];

export const fetchDepartments = async (): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockDepartments;
  const data = await apiClient.get<Department[]>(
    "/preset-data/fetch-departments",
  );
  return toList(data).map((item) => ({
    value: String(item.departmentId),
    label: item.departmentName,
  }));
};

export const fetchExams = async (): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockExams;
  const data = await apiClient.get<Exam[]>("/preset-data/fetch-external-exams");
  return toList(data).map((item) => ({
    value: String(item.examId),
    label: item.examAbbreviation,
  }));
};

interface PaymentMethod {
  paymentMethodId: string;
  paymentMethodName: string;
}

export const fetchPaymentMethods = async (): Promise<DropdownOption[]> => {
  if (isMockMode()) return mockPaymentMethods;
  const data = await apiClient.get<PaymentMethod[]>(
    "/preset-data/fetch-payment-methods?paymentMethodIds=CC,BT",
  );
  return toList(data).map((item) => ({
    value: item.paymentMethodId,
    label: item.paymentMethodName,
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

const getNameParts = (fullName: string) => {
  const [firstName = "User", ...rest] = fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" ") || "Account",
  };
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
  },
  extras: { paymentMethodId: string },
): SignupPayload => {
  return {
    fullName: formData.fullName.trim(),
    emailAddress: formData.emailAddress.trim(),
    phoneNumber: formData.phoneNumber.trim(),
    departmentId: formData.department.trim(),
    examId: formData.exam.trim(),
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    paymentMethodId: extras.paymentMethodId,
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
  const body = {
    fullName: payload.fullName,
    emailAddress: payload.emailAddress,
    phoneNumber: payload.phoneNumber,
    departmentId: payload.departmentId,
    examId: payload.examId,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    paymentMethodId: payload.paymentMethodId,
  };

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

  return apiClient.post<AuthApiResponse, typeof body>(
    "/user/auth/signup",
    body,
  );
};

export const loginUser = async (payload: LoginPayload) => {
  if (isMockMode()) return mockLogin(payload);
  return apiClient.post<AuthApiResponse, LoginPayload>("/user/auth/login", payload);
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
  return apiClient.post<AuthApiResponse, VerifySignupOtpPayload>("/user/auth/create-new-password", payload);
};

export const requestPasswordRecovery = async (emailAddress: string): Promise<{ userId: string }> => {
  const capability = getRecoveryCapability();
  if (!capability.available) throw new FeatureUnavailableError(capability.reason ?? "Password recovery is unavailable.");
  if (isMockMode()) return { userId: `demo-${emailAddress.trim().toLowerCase()}` };

  const response = await apiClient.post<AuthApiResponse, { emailAddress: string }>(
    getEndpoints().recoveryRequest as string,
    { emailAddress },
  );
  const userId = getStringValue(response ?? {}, ["userId", "id"]);
  if (!userId) throw new Error("We couldn't start password recovery. Please try again.");
  return { userId };
};

export const resendSignupOtp = async (userId: string): Promise<void> => {
  const capability = getResendOtpCapability();
  if (!capability.available) throw new FeatureUnavailableError(capability.reason ?? "Resending codes is unavailable.");
  if (isMockMode()) return;
  await apiClient.post(getEndpoints().resendOtp as string, { userId });
};

export const getSignupVerificationData = (
  response: AuthApiResponse,
  signupPayload: SignupPayload,
): PendingSignupVerification => {
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
): { token: string; user: AuthResponse } => {
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
  return apiClient.post<AuthApiResponse>(
    `/user/auth/signup-success?transactionId=${encodeURIComponent(transactionId)}&paymentKey=${encodeURIComponent(paymentKey)}`,
  );
};
