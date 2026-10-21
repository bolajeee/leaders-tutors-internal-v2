import type { UserSubscription } from "@/types/portal";
import type { WalletTransaction } from "@/types/payment";

export interface AppNotification {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  body: string;
  href?: string;
}

export const EXPIRY_WARNING_DAYS = 7;

/** Derives account notifications from the student's current subscription and payments. */
export const buildNotifications = (
  subscription: UserSubscription | null | undefined,
  transactions: WalletTransaction[] = [],
): AppNotification[] => {
  const items: AppNotification[] = [];

  if (subscription && !subscription.isSubscriptionActive) {
    items.push({
      id: "subscription-expired",
      tone: "danger",
      title: "Your learning access has expired",
      body: "You can still browse the curriculum. Renew to open lessons.",
      href: "/subscriptions",
    });
  } else if (subscription && (subscription.daysLeft ?? 0) <= EXPIRY_WARNING_DAYS) {
    const days = subscription.daysLeft ?? 0;
    items.push({
      id: `subscription-expiring-${days}`,
      tone: "warning",
      title: `Access ends in ${days} day${days === 1 ? "" : "s"}`,
      body: "Renew early so your lessons stay available.",
      href: "/subscriptions",
    });
  }

  for (const transaction of transactions) {
    if (transaction.status === "pending") {
      items.push({
        id: `payment-pending-${transaction.id}`,
        tone: "info",
        title: "Payment awaiting confirmation",
        body: `${transaction.description} (${transaction.id}) has not been confirmed yet.`,
        href: "/transactions",
      });
    }
  }

  return items;
};
