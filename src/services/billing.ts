import { apiClient } from "@/lib/api-client";
import {
  getEndpoints,
  getRenewalCapability,
  isMockMode,
  SUBSCRIPTION_PRICE,
} from "@/lib/config";
import { FeatureUnavailableError, PaymentCancelledError } from "@/lib/errors";
import { requestMockCheckout } from "@/services/mock/checkout";
import { useDemoStore } from "@/services/mock/demoStore";

export interface RenewalResult {
  transactionId: string;
  status: "success" | "pending";
  daysAdded: number;
}

const mockRenewal = async (email: string): Promise<RenewalResult> => {
  const demo = useDemoStore.getState();
  demo.ensureAccount(email);
  const transactionId = `RENEW-${Date.now()}`;
  const base = {
    id: transactionId,
    amount: SUBSCRIPTION_PRICE.amount,
    currency: SUBSCRIPTION_PRICE.currency,
    type: "subscription" as const,
    createdAt: new Date().toISOString(),
    description: "Student plan renewal",
  };

  const outcome = await requestMockCheckout({
    purpose: "Renew learning access",
    email,
    amount: SUBSCRIPTION_PRICE.amount,
  });

  const store = useDemoStore.getState();
  if (outcome === "paid") {
    store.recordTransaction({ ...base, status: "success" });
    store.renew(SUBSCRIPTION_PRICE.days);
    return { transactionId, status: "success", daysAdded: SUBSCRIPTION_PRICE.days };
  }
  if (outcome === "pending") {
    store.recordTransaction({ ...base, status: "pending" });
    return { transactionId, status: "pending", daysAdded: 0 };
  }
  store.recordTransaction({ ...base, status: "cancelled" });
  throw new PaymentCancelledError();
};

/**
 * Renew the student's subscription. In API mode this only runs when a renewal
 * endpoint is configured, so the app never reports a payment that did not happen.
 */
export const renewSubscription = async (email: string): Promise<RenewalResult> => {
  const capability = getRenewalCapability();
  if (!capability.available) {
    throw new FeatureUnavailableError(capability.reason ?? "Renewal is unavailable.");
  }
  if (isMockMode()) return mockRenewal(email);

  const result = await apiClient.post<Partial<RenewalResult>>(getEndpoints().renewal as string);
  return {
    transactionId: String(result?.transactionId ?? ""),
    status: result?.status === "success" ? "success" : "pending",
    daysAdded: Number(result?.daysAdded) || 0,
  };
};
