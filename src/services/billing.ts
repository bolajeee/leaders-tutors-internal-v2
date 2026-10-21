import {
  getRenewalCapability,
  isMockMode,
  SUBSCRIPTION_PRICE,
} from "@/lib/config";
import { ApiError, FeatureUnavailableError, PaymentCancelledError } from "@/lib/errors";
import { liveCall } from "@/lib/live-api";
import { fetchDepartments, fetchExams } from "@/services/auth";
import { parseLiveAccount, parseLiveDate } from "@/services/live-account";
import { requestMockCheckout } from "@/services/mock/checkout";
import { useDemoStore } from "@/services/mock/demoStore";
import {
  convertToKobo,
  initializePaystackPayment,
  loadPaystackScript,
} from "@/services/paystack";
import { useAuthStore } from "@/store/authStore";

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

/** Renewal is always paid online; "WAL" (the wallet) is the API's other method. */
const ONLINE_PAYMENT = "DO";

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The department and class to renew. They come from the plan the student last
 * held; when the API did not send ids, they are looked up by name.
 */
const resolveEnrollment = async () => {
  const { account, userEnrollment } = useAuthStore.getState();
  const plan = account?.subscription;
  const departmentName = plan?.departmentName || userEnrollment?.departmentName || "";
  const className = plan?.className || userEnrollment?.examAbbreviation || "";

  let departmentId = plan?.departmentId || userEnrollment?.departmentId || "";
  if (!departmentId && departmentName) {
    departmentId = (await fetchDepartments()).find((item) => sameName(item.label, departmentName))?.value ?? "";
  }
  let classId = plan?.classId || userEnrollment?.examId || "";
  if (!classId && departmentId && className) {
    classId = (await fetchExams(departmentId)).find((item) => sameName(item.label, className))?.value ?? "";
  }
  if (!departmentId || !classId) {
    throw new ApiError("We couldn't work out which class to renew. Please contact support.", 400);
  }
  return { departmentId, classId };
};

/** Opens Paystack for a payment the API has already logged and resolves once it is paid. */
const payOnline = (payment: { key: string; email: string; amount: number; reference: string }) =>
  new Promise<void>((resolve, reject) => {
    void loadPaystackScript()
      .then(() =>
        initializePaystackPayment({
          publicKey: payment.key,
          email: payment.email,
          amount: convertToKobo(payment.amount),
          reference: payment.reference,
          label: "Renew learning access",
          metadata: { transactionId: payment.reference, purpose: "subscription" },
          onSuccess: () => resolve(),
          onClose: () => reject(new PaymentCancelledError()),
        }),
      )
      .catch(reject);
  });

const liveRenewal = async (): Promise<RenewalResult> => {
  const { departmentId, classId } = await resolveEnrollment();
  const previousEnd = parseLiveDate(useAuthStore.getState().account?.subscription?.endDate);

  const order = await liveCall<{
    subscription_id?: string | number;
    transaction_id?: string | number;
    amount?: string | number;
    email?: string;
    paystack_payment_key?: string;
  }>("/user/subscription/renew-subscription", {
    department_id: departmentId,
    class_id: classId,
    payment_method_id: ONLINE_PAYMENT,
  });
  const transactionId = String(order.transaction_id ?? "");
  const subscriptionId = String(order.subscription_id ?? "");
  const amount = Number(order.amount) || SUBSCRIPTION_PRICE.amount;
  const paymentKey = String(order.paystack_payment_key ?? "");
  const email = order.email || useAuthStore.getState().user?.email || "";
  if (!transactionId || !paymentKey) {
    throw new ApiError("We couldn't start your renewal payment. Please try again.", 502);
  }

  try {
    await payOnline({ key: paymentKey, email, amount, reference: transactionId });
  } catch (failure) {
    if (failure instanceof PaymentCancelledError) {
      await liveCall("/user/subscription/subscription-cancelled", {
        transaction_id: transactionId,
        subscription_id: subscriptionId,
      }).catch(() => undefined);
    }
    throw failure;
  }

  try {
    const confirmed = await liveCall("/user/subscription/subscription-success", {
      transaction_id: transactionId,
      subscription_id: subscriptionId,
      amount,
      payment_key: paymentKey,
    });
    const account = parseLiveAccount(confirmed);
    if (account) useAuthStore.getState().setAccount(account);

    const newEnd = parseLiveDate(account?.subscription?.endDate);
    const daysAdded =
      previousEnd && newEnd
        ? Math.max(1, Math.round((newEnd.getTime() - Math.max(previousEnd.getTime(), Date.now())) / 86_400_000))
        : SUBSCRIPTION_PRICE.days;
    return { transactionId, status: "success", daysAdded };
  } catch {
    // Money has moved but the API has not confirmed it yet: say so instead of guessing.
    return { transactionId, status: "pending", daysAdded: 0 };
  }
};

/** Renew the student's subscription by paying online through Paystack. */
export const renewSubscription = async (email: string): Promise<RenewalResult> => {
  const capability = getRenewalCapability();
  if (!capability.available) {
    throw new FeatureUnavailableError(capability.reason ?? "Renewal is unavailable.");
  }
  if (isMockMode()) return mockRenewal(email);
  return liveRenewal();
};
