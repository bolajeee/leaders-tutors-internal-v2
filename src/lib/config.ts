/**
 * Runtime configuration. Everything is read at call time (not module load) so
 * the app can switch modes in tests and so `NEXT_PUBLIC_*` values are inlined
 * by Next at build time.
 */
export type DataSource = "mock" | "api";

export const getDataSource = (): DataSource =>
  process.env.NEXT_PUBLIC_CURRICULUM_SOURCE === "api" ? "api" : "mock";

export const isMockMode = () => getDataSource() === "mock";

export const SUPPORT_CONTACT = {
  phone: "+234 708 701 3213",
  customerCare: "+234 812 700 0262",
  email: "Info@leaderstutors.com",
} as const;

export const SUBSCRIPTION_PRICE = { amount: 1000, currency: "₦", days: 30 } as const;

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** In api mode every capability below needs the live API's base URL. */
const isApiConfigured = () => Boolean(clean(process.env.NEXT_PUBLIC_BASE_URL));

export interface Capability {
  available: boolean;
  /** Plain-language explanation shown when the capability is unavailable. */
  reason?: string;
}

const supportHint = `Please contact support on ${SUPPORT_CONTACT.phone} or ${SUPPORT_CONTACT.email}.`;

export const getRenewalCapability = (): Capability => {
  if (isMockMode() || isApiConfigured()) return { available: true };
  return {
    available: false,
    reason: `Online renewal is not enabled for this environment yet. ${supportHint}`,
  };
};

export const getRecoveryCapability = (): Capability => {
  if (isMockMode() || isApiConfigured()) return { available: true };
  return {
    available: false,
    reason: `Online password recovery is not enabled yet. ${supportHint}`,
  };
};

export const getResendOtpCapability = (): Capability => {
  if (isMockMode() || isApiConfigured()) return { available: true };
  return {
    available: false,
    reason: "Didn't get a code? Check your spam folder or contact support.",
  };
};

/** The live API has no in-portal change-password call; recovery by emailed code is the only route. */
export const getChangePasswordCapability = (): Capability => {
  if (isMockMode()) return { available: true };
  return {
    available: false,
    reason:
      "Changing your password from inside the portal isn't available yet. Sign out and use \"Forgot password\" on the login page to set a new one.",
  };
};

/** Only same-origin absolute paths may be used as post-login destinations. */
export const safeNextPath = (value: string | null | undefined, fallback = "/dashboard") => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
};
