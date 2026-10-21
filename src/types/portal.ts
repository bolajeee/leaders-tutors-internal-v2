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
