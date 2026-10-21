export interface DashboardSummary {
  subscriptionExpiresIn: number;
  walletBalance: number;
  currency: string;
  subscriptionStatus?: "active" | "expired" | "pending";
  subscriptionType?: string;
}

export interface TutorialVideo {
  id: string;
  title: string;
  subject: string;
  department: string;
  exam: string;
  year: number | string;
  videoUrl: string;
  thumbnailUrl?: string;
  materialUrl?: string;
  duration?: string;
  description?: string;
}

export interface TutorialSubject {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  exam: string;
  examId: string;
  examAbbr?: string;
}

export type SubjectAccordionData = TutorialSubject;

export interface ClassVideo {
  id: string;
  title: string;
  year: string;
  yearId?: string;
  duration?: string;
  subjectId: string;
  description?: string;
  thumbnailUrl?: string;
}

// A subject together with its videos already grouped by year — derived from
// the fetch-tutorials-by-department-and-exam response so no second API call
// is ever needed.
export interface YearGroup {
  yearId: string;
  yearLabel: string; // e.g. "2024"
  videos: ClassVideo[];
}

export interface SubjectWithVideos {
  subjectId: string;
  subjectName: string;
  departmentId: string;
  examId: string;
  yearGroups: YearGroup[]; // sorted newest-first, including years awaiting content
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
