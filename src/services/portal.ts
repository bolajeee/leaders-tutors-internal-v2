import { isMockMode } from "@/lib/config";
import {
  AccountSnapshot,
  DashboardSummary,
  PaymentStatus,
  UserEnrollment,
  UserSubscription,
} from "@/types/portal";
import { useAuthStore } from "@/store/authStore";
import { parseLiveDate } from "@/services/live-account";
import { daysUntil, useDemoStore } from "@/services/mock/demoStore";

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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The live API has no "fetch my subscription" call. Login, payment and profile
 * replies report the plan and wallet, so the app keeps the latest of those and
 * works out the days left from the plan's end date.
 */
export const subscriptionFromAccount = (account: AccountSnapshot | null): UserSubscription => {
  const plan = account?.subscription;
  const endsAt = parseLiveDate(plan?.endDate);
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY_MS)) : 0;
  const isActive = daysLeft > 0;

  return {
    isSubscriptionActive: isActive,
    subscriptionExpiresAt: endsAt?.toISOString() ?? new Date().toISOString(),
    subscriptionType: "Student plan",
    walletBalance: account?.walletBalance ?? 0,
    currency: "₦",
    departmentId: plan?.departmentId ?? "",
    departmentName: plan?.departmentName ?? "",
    examId: plan?.classId ?? "",
    examAbbreviation: plan?.className ?? "",
    lastPaymentDate: plan?.startDate || undefined,
    subscriptionId: plan?.subscriptionId,
    daysLeft,
    statusName: isActive ? "ACTIVE" : "EXPIRED",
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

  const { account } = useAuthStore.getState();
  if (!account) return inactiveSubscription();

  const subscription = subscriptionFromAccount(account);
  const enrollment = enrollmentFromSubscription(subscription);
  if (enrollment) {
    useAuthStore.getState().setUserEnrollment(enrollment);
  }
  return subscription;
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
