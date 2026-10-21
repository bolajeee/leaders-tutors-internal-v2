import { apiClient } from "@/lib/api-client";
import { AuthResponse } from "@/types/auth/auth";

export const PENDING_SIGNUP_EMAIL_STORAGE_KEY = "leaders-tutors-signup-email";
export const PENDING_SIGNUP_VERIFICATION_STORAGE_KEY =
  "leaders-tutors-pending-signup";

interface LoginPayload {
  emailAddress: string;
  password: string;
}

interface SignupPayload {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  departmentId: string;
  examId: string;
  password: string;
  confirmPassword: string;
  paymentMethodId?: string;
}

interface VerifySignupOtpPayload {
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

interface DropdownOption {
  value: string;
  label: string;
}

export const fetchDepartments = async (): Promise<DropdownOption[]> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return [
      { value: "basic", label: "Basic School" },
      { value: "junior", label: "Junior Secondary" },
      { value: "senior", label: "Senior Secondary" },
    ];
  }
  const data = await apiClient.get<Department[]>(
    "/preset-data/fetch-departments",
  );

  const finalData = Array.isArray(data)
    ? data
    : (data as { data?: Department[] })?.data || [];

  return finalData.map((item: Department) => ({
    value: String(item.departmentId),
    label: item.departmentName,
  }));
};

export const fetchSubjects = async (
  departmentId?: string,
): Promise<DropdownOption[]> => {
  const data = await apiClient.get<unknown[]>(
    departmentId
      ? `/preset-data/fetch-external-subjects?departmentId=${departmentId}`
      : "/preset-data/fetch-external-subjects",
  );

  const finalData = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data || [];

  return finalData.map((item: unknown) => ({
    value: String(
      (item as { subjectId?: unknown; id?: unknown }).subjectId ||
        (item as { id?: unknown }).id,
    ),
    label:
      (item as { subjectName?: string; name?: string }).subjectName ||
      (item as { name?: string }).name ||
      "",
  }));
};

export const fetchExams = async (): Promise<DropdownOption[]> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return [
      { value: "basic-5", label: "Basic 5" },
      { value: "jss-2", label: "JSS 2" },
      { value: "sss-2", label: "SSS 2" },
    ];
  }
  const data = await apiClient.get<Exam[]>("/preset-data/fetch-external-exams");

  const finalData = Array.isArray(data)
    ? data
    : (data as { data?: Exam[] })?.data || [];

  return finalData.map((item: Exam) => ({
    value: String(item.examId),
    label: item.examAbbreviation,
  }));
};

interface PaymentMethod {
  paymentMethodId: string;
  paymentMethodName: string;
}

export const fetchPaymentMethods = async (): Promise<DropdownOption[]> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return [{ value: "CC", label: "Card payment (Paystack)" }];
  }
  const data = await apiClient.get<PaymentMethod[]>(
    "/preset-data/fetch-payment-methods?paymentMethodIds=CC,BT",
  );

  const finalData = Array.isArray(data)
    ? data
    : (data as { data?: PaymentMethod[] })?.data || [];

  return finalData.map((item: PaymentMethod) => ({
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
    emailAddress: formData.emailAddress,
    phoneNumber: formData.phoneNumber,
    departmentId: formData.department.trim(),
    examId: formData.exam.trim(),
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    paymentMethodId: extras.paymentMethodId,
  };
};

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

  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return {
      userId: `demo-${Date.now()}`,
      emailAddress: payload.emailAddress,
      paymentProceedData: {
        transactionId: `SIGNUP-${Date.now()}`,
        amount: 1000,
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
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return {
      accessKey: "local-demo-session",
      userId: "demo-student",
      emailAddress: payload.emailAddress,
      fullName: "Demo Student",
      departmentId: "basic",
      departmentName: "Basic School",
      examId: "basic-5",
      examAbbreviation: "Basic 5",
      role: "Student",
      status: "Active",
    };
  }
  return apiClient.post<AuthApiResponse, LoginPayload>("/user/auth/login", payload);
};

export const verifySignupOtp = async (payload: VerifySignupOtpPayload) => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    if (String(payload.otp).length !== 6) throw new Error("Enter a six-digit verification code.");
    return { success: true };
  }
  return apiClient.post<AuthApiResponse, VerifySignupOtpPayload>("/user/auth/create-new-password", payload);
};

export const getSignupVerificationData = (
  response: AuthApiResponse,
  signupPayload: SignupPayload,
): PendingSignupVerification => {
  // Try to extract userId from various possible locations
  let extractedUserId = null;

  if (response) {
    const responseData = response as Record<string, unknown>;
    const dataObj = responseData?.data as Record<string, unknown> | undefined;
    const userObj = responseData?.user as Record<string, unknown> | undefined;

    extractedUserId =
      getStringValue(response, ["userId", "id"]) ||
      (dataObj
        ? getStringValue(dataObj as AuthApiResponse, ["userId", "id"])
        : null) ||
      (userObj
        ? getStringValue(userObj as AuthApiResponse, ["userId", "id"])
        : null);
  }

  const responseData = response as Record<string, unknown>;
  const nestedData = responseData?.data as Record<string, unknown> | undefined;
  const paymentProceedData = (responseData?.paymentProceedData ||
    nestedData?.paymentProceedData) as
    | PendingSignupVerification["paymentProceedData"]
    | undefined;

  console.log("Full signup response:", JSON.stringify(response, null, 2));
  console.log("Payment proceed data:", paymentProceedData);

  return {
    userId: extractedUserId ? String(extractedUserId) : `temp_${Date.now()}`,
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

export const normalizeAuthResponse = (
  response: AuthApiResponse,
  fallbackEmail: string,
): { token: string; user: AuthResponse } => {
  console.log("normalizeAuthResponse - Full response:", response);

  // Check if data is nested in a 'data' property
  const dataObj = response?.data as Record<string, unknown> | undefined;
  const sourceData = dataObj || response;

  console.log("normalizeAuthResponse - Source data:", sourceData);

  const token = getStringValue(sourceData as AuthApiResponse, [
    "accessKey",
    "accessToken",
    "token",
  ]);

  console.log("normalizeAuthResponse - Extracted token:", token);

  if (!token) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  const fullName = getStringValue(sourceData as AuthApiResponse, ["fullName"]);
  const { firstName, lastName } = getNameParts(fullName);

  const normalizedUser = {
    token,
    user: {
      token,
      id: getStringValue(
        sourceData as AuthApiResponse,
        ["id", "userId"],
        "unknown-user",
      ),
      email: getStringValue(
        sourceData as AuthApiResponse,
        ["email", "emailAddress"],
        fallbackEmail,
      ),
      first_name: getStringValue(
        sourceData as AuthApiResponse,
        ["first_name", "firstName"],
        firstName,
      ),
      last_name: getStringValue(
        sourceData as AuthApiResponse,
        ["last_name", "lastName"],
        lastName,
      ),
      phone_number:
        getStringValue(sourceData as AuthApiResponse, [
          "phone_number",
          "phoneNumber",
        ]) || null,
      last_active: getStringValue(
        sourceData as AuthApiResponse,
        ["last_active", "lastActive", "lastLoginTime"],
        new Date().toISOString(),
      ),
      role: getStringValue(sourceData as AuthApiResponse, ["role"], "User"),
      status: getStringValue(
        sourceData as AuthApiResponse,
        ["status"],
        "Active",
      ),
      middle_name:
        getStringValue(sourceData as AuthApiResponse, [
          "middle_name",
          "middleName",
        ]) || null,
      // Enrollment — the login response carries these so the app can fetch
      // tutorials immediately without a separate subscription call.
      // departmentId can be a number (1) — coerce to string explicitly.
      // Fields live both at top level AND in nested departmentData/examData.
      departmentId: (() => {
        const src = sourceData as Record<string, unknown>;
        const deptData = src.departmentData as
          | Record<string, unknown>
          | undefined;
        const raw = src.departmentId ?? deptData?.departmentId;
        if (raw === undefined || raw === null || raw === "") return undefined;
        return String(raw);
      })(),
      departmentName: (() => {
        const src = sourceData as Record<string, unknown>;
        const deptData = src.departmentData as
          | Record<string, unknown>
          | undefined;
        const raw =
          deptData?.departmentName ??
          src.departmentName ??
          src.department_name ??
          src.department;
        return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
      })(),
      examId: (() => {
        const src = sourceData as Record<string, unknown>;
        const examData = src.examData as Record<string, unknown> | undefined;
        const raw = src.examId ?? examData?.examId;
        if (raw === undefined || raw === null || raw === "") return undefined;
        return String(raw);
      })(),
      examAbbreviation: (() => {
        const src = sourceData as Record<string, unknown>;
        const examData = src.examData as Record<string, unknown> | undefined;
        const raw =
          examData?.examAbbreviation ??
          src.examAbbreviation ??
          src.examAbbr ??
          src.exam_abbreviation;
        return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
      })(),
    },
  };

  console.log("normalizeAuthResponse - Normalized result:", normalizedUser);

  return normalizedUser;
};

/**
 * Complete signup after successful payment
 */
export const completeSignupSuccess = async (
  transactionId: string,
  paymentKey: string,
): Promise<AuthApiResponse> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    return {
      accessKey: "local-demo-session",
      userId: "demo-student",
      fullName: "Demo Student",
      emailAddress: "student@leaderstutors.com",
      departmentId: "basic",
      departmentName: "Basic School",
      examId: "basic-5",
      examAbbreviation: "Basic 5",
      role: "Student",
      status: "Active",
      transactionId,
      paymentKey,
    };
  }
  return apiClient.post<AuthApiResponse>(
    `/user/auth/signup-success?transactionId=${transactionId}&paymentKey=${paymentKey}`,
  );
};
