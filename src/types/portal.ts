export interface DashboardSummary {
  subscriptionExpiresIn: number;
  walletBalance: number;
  currency: string;
  subscriptionStatus?: "active" | "expired" | "pending";
  subscriptionType?: string;
}

export interface UserSubscription {
  isSubscriptionActive: boolean;
  subscriptionExpiresAt: string;
  subscriptionType: string;
  walletBalance: number;
  currency: string;
  departmentId: string;
  departmentName: string;
  examId: string;
  examAbbreviation: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  // Fields from actual API response
  subscriptionId?: string;
  daysLeft?: number;
  statusName?: string;
}

export interface PaymentStatus {
  isSubscriptionActive: boolean;
  subscriptionExpiresAt: string;
  subscriptionType: string;
  walletBalance: number;
  currency: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
}

export interface UserEnrollment {
  departmentId: string;
  departmentName: string;
  examId: string;
  examAbbreviation: string;
  status?: string;
}

/**
 * What the live API last reported about the student's wallet and plan. It has
 * no "fetch my subscription" call; login, payment and profile replies carry
 * this instead, so the app keeps the latest one.
 */
export interface AccountSnapshot {
  walletBalance: number;
  statusName: string;
  subscription?: {
    subscriptionId?: string;
    departmentId: string;
    departmentName: string;
    classId: string;
    className: string;
    /** As the API sends them, e.g. "2025-01-31 10:20:30". */
    startDate: string;
    endDate: string;
  };
}
