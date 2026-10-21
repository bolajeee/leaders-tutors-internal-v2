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

/** Optional endpoints. A missing path means the capability is unavailable. */
export const getEndpoints = () => ({
  curriculum: clean(process.env.NEXT_PUBLIC_CURRICULUM_API_PATH),
  renewal: clean(process.env.NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH),
  recoveryRequest: clean(process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_PATH),
  resendOtp: clean(process.env.NEXT_PUBLIC_RESEND_OTP_PATH),
});

export interface Capability {
  available: boolean;
  /** Plain-language explanation shown when the capability is unavailable. */
  reason?: string;
}

const supportHint = `Please contact support on ${SUPPORT_CONTACT.phone} or ${SUPPORT_CONTACT.email}.`;

export const getRenewalCapability = (): Capability => {
  if (isMockMode() || getEndpoints().renewal) return { available: true };
  return {
    available: false,
    reason: `Online renewal is not enabled for this environment yet. ${supportHint}`,
  };
};

export const getRecoveryCapability = (): Capability => {
  if (isMockMode() || getEndpoints().recoveryRequest) return { available: true };
  return {
    available: false,
    reason: `Online password recovery is not enabled yet. ${supportHint}`,
  };
};

export const getResendOtpCapability = (): Capability => {
  if (isMockMode() || getEndpoints().resendOtp) return { available: true };
  return {
    available: false,
    reason: "Didn't get a code? Check your spam folder or contact support.",
  };
};

/** Only same-origin absolute paths may be used as post-login destinations. */
export const safeNextPath = (value: string | null | undefined, fallback = "/dashboard") => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
};
