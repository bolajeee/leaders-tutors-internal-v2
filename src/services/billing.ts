import { apiClient } from "@/lib/api-client";

export interface RenewalResult {
  transactionId: string;
  status: "success" | "pending";
  daysAdded: number;
}

export const renewSubscription = async (): Promise<RenewalResult> => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { transactionId: `MOCK-${Date.now()}`, status: "success", daysAdded: 30 };
  }

  const endpoint = process.env.NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH;
  if (!endpoint) throw new Error("Subscription renewal is not configured for this environment. Please contact support.");
  return apiClient.post<RenewalResult>(endpoint);
};
