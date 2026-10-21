import type { UserSubscription } from "@/types/portal";

/** loading → unknown yet; error → the status could not be determined. */
export type AccessStatus = "loading" | "error" | "active" | "expired";

export const resolveAccess = (state: {
  isLoading: boolean;
  isError: boolean;
  subscription?: UserSubscription | null;
}): AccessStatus => {
  if (state.subscription) return state.subscription.isSubscriptionActive ? "active" : "expired";
  if (state.isError) return "error";
  return state.isLoading ? "loading" : "error";
};

/** Protected lesson content (video, notes, CBT) opens only with an active subscription. */
export const canOpenLesson = (status: AccessStatus) => status === "active";
