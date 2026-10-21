import { apiClient } from "@/lib/api-client";
import { isMockMode } from "@/lib/config";
import {
  DashboardSummary,
  PaymentStatus,
  UserEnrollment,
  UserSubscription,
} from "@/types/portal";
import { useAuthStore } from "@/store/authStore";
import { daysUntil, useDemoStore } from "@/services/mock/demoStore";

type RecordLike = Record<string, unknown>;

interface ApiErrorLike {
  status?: number;
  response?: { status?: number };
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const apiError = error as ApiErrorLike;
  return apiError.status ?? apiError.response?.status;
};

export const inactiveSubscription = (): UserSubscription => ({
  isSubscriptionActive: false,
  subscriptionExpiresAt: new Date().toISOString(),
  subscriptionType: "basic",
  walletBalance: 0,
  currency: "₦",
  departmentId: "",
  departmentName: "",
  examId: "",
  examAbbreviation: "",
  daysLeft: 0,
  statusName: "INACTIVE",
});

const asRecord = (value: unknown): RecordLike => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RecordLike;
  }
  return {};
};

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

/**
 * Maps the subscription-status response (the API client has already removed
 * the outer envelope) into the portal's subscription shape.
 */
export const mapSubscription = (raw: unknown): UserSubscription => {
  const data = asRecord(raw);

  // statusData is nested: { statusId, statusName }
  const statusData = asRecord(data.statusData);
  const statusName = asString(statusData.statusName).toUpperCase();
  const statusId = asString(data.statusId ?? statusData.statusId);
  const isActive =
    statusId === "1" || statusName === "ACTIVE" || statusName === "ACTIVE!";

  // daysLeft is pre-calculated by the backend.
  const daysLeft = asNumber(data.daysLeft, 0);
  const expiresAt = asString(
    data.subscriptionEndDate ?? data.expiresAt ?? data.expiryDate ?? "",
  );

  // departmentId / examId are not part of the subscription response; they live
  // in the enrollment persisted at login/signup.
  const storedEnrollment = useAuthStore.getState().userEnrollment;

  return {
    isSubscriptionActive: isActive && daysLeft > 0,
    subscriptionExpiresAt: expiresAt || new Date().toISOString(),
    subscriptionType: "basic",
    walletBalance: asNumber(data.walletBalance ?? data.balance, 0),
    currency: asString(data.currency, "₦"),
    departmentId: asString(
      data.departmentId,
      storedEnrollment?.departmentId ?? "",
    ),
    departmentName: asString(
      data.departmentName ?? data.department,
      storedEnrollment?.departmentName ?? "",
    ),
    examId: asString(data.examId, storedEnrollment?.examId ?? ""),
    examAbbreviation: asString(
      data.examAbbreviation ?? data.examAbbr,
      storedEnrollment?.examAbbreviation ?? "",
    ),
    lastPaymentDate:
      asString(data.subscriptionStartDate ?? data.createdAt) || undefined,
    subscriptionId: asString(data.subscriptionId) || undefined,
    daysLeft,
    statusName,
  };
};

const enrollmentFromSubscription = (
  subscription: UserSubscription,
): UserEnrollment | null => {
  if (!subscription.departmentId && !subscription.examId) {
    return null;
  }

  return {
    departmentId: subscription.departmentId,
    departmentName: subscription.departmentName,
    examId: subscription.examId,
    examAbbreviation: subscription.examAbbreviation,
    status: subscription.isSubscriptionActive ? "active" : "expired",
  };
};

const mockSubscription = (): UserSubscription => {
  const { user, userEnrollment } = useAuthStore.getState();
  if (user?.email) useDemoStore.getState().ensureAccount(user.email);
  const demo = useDemoStore.getState();
  const daysLeft = daysUntil(demo.subscriptionEndsAt);
  const lastPayment = demo.transactions.find(
    (item) => item.type === "subscription" && item.status === "success",
  );

  return {
    isSubscriptionActive: daysLeft > 0,
    subscriptionExpiresAt: demo.subscriptionEndsAt ?? new Date().toISOString(),
    subscriptionType: "Student plan",
    walletBalance: demo.walletBalance,
    currency: "₦",
    departmentId: userEnrollment?.departmentId ?? user?.departmentId ?? "basic",
    departmentName: userEnrollment?.departmentName ?? user?.departmentName ?? "Basic School",
    examId: userEnrollment?.examId ?? user?.examId ?? "basic-5",
    examAbbreviation: userEnrollment?.examAbbreviation ?? user?.examAbbreviation ?? "Basic 5",
    lastPaymentDate: lastPayment?.createdAt,
    subscriptionId: "SUB-DEMO-1001",
    daysLeft,
    statusName: daysLeft > 0 ? "ACTIVE" : "EXPIRED",
  };
};

export const fetchUserSubscription = async (): Promise<UserSubscription> => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return inactiveSubscription();
  }

  if (isMockMode()) return mockSubscription();

  try {
    const data = await apiClient.get<unknown>(
      "/user/accounts/fetch-user-subscription",
    );
    const subscription = mapSubscription(data);
    const enrollment = enrollmentFromSubscription(subscription);
    if (enrollment) {
      useAuthStore.getState().setUserEnrollment(enrollment);
    }
    return subscription;
  } catch (error: unknown) {
    // A student with no subscription record is simply not subscribed. A 401 is
    // handled globally as an expired session; everything else surfaces to the UI.
    const status = getErrorStatus(error);
    if (status === 403 || status === 404) {
      return inactiveSubscription();
    }
    throw error;
  }
};

export const checkPaymentStatus = async (): Promise<PaymentStatus> => {
  const subscription = await fetchUserSubscription();
  return {
    isSubscriptionActive: subscription.isSubscriptionActive,
    subscriptionExpiresAt: subscription.subscriptionExpiresAt,
    subscriptionType: subscription.subscriptionType,
    walletBalance: subscription.walletBalance,
    currency: subscription.currency,
    lastPaymentDate: subscription.lastPaymentDate,
    nextBillingDate: subscription.nextBillingDate,
  };
};

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const subscription = await fetchUserSubscription();
  return {
    subscriptionExpiresIn: subscription.daysLeft ?? 0,
    walletBalance: subscription.walletBalance,
    currency: subscription.currency,
    subscriptionStatus: subscription.isSubscriptionActive ? "active" : "expired",
    subscriptionType: subscription.subscriptionType,
  };
};

export const fetchUserEnrollment = async (): Promise<UserEnrollment | null> => {
  const subscription = await fetchUserSubscription();
  return enrollmentFromSubscription(subscription);
};
