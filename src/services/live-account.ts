import type { AuthResponse } from "@/types/auth/auth";
import type { AccountSnapshot } from "@/types/portal";

type Raw = Record<string, unknown>;

export const isRecord = (value: unknown): value is Raw =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const text = (source: Raw, keys: string[], fallback = ""): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

const amount = (value: unknown): number => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/** First row of a list-shaped field; the live API wraps single records in arrays. */
const firstRow = (source: Raw, key: string): Raw | undefined => {
  const value = source[key];
  const row = Array.isArray(value) ? value[0] : value;
  return isRecord(row) ? row : undefined;
};

export const getNameParts = (fullName: string) => {
  const [firstName = "User", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || "Account" };
};

/** The API sends dates as "YYYY-MM-DD HH:MM:SS"; make that parseable everywhere. */
export const parseLiveDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
};

/** True when the reply is a login-shaped payload (`user` and `subscription` rows). */
export const isLiveSession = (reply: unknown): boolean =>
  isRecord(reply) && Boolean(firstRow(reply, "user"));

/** Wallet and plan details from any reply that carries `user` and `subscription` rows. */
export const parseLiveAccount = (reply: Raw): AccountSnapshot | null => {
  const user = firstRow(reply, "user");
  if (!user) return null;
  const plan = firstRow(reply, "subscription");

  return {
    walletBalance: amount(user.wallet_balance),
    statusName: text(user, ["status_name"]),
    subscription: plan
      ? {
          subscriptionId: text(plan, ["subscription_id"]) || undefined,
          departmentId: text(plan, ["department_id"]),
          departmentName: text(plan, ["department_name"]),
          classId: text(plan, ["class_id"]),
          className: text(plan, ["class_name"]),
          startDate: text(plan, ["subscription_start_date"]),
          endDate: text(plan, ["subscription_end_date"]),
        }
      : undefined,
  };
};

/** Maps a live login, sign-up or payment reply into the app's session shape. */
export const parseLiveSession = (
  reply: Raw,
  fallbackEmail: string,
): { token: string; user: AuthResponse; account: AccountSnapshot } => {
  const user = firstRow(reply, "user");
  const account = parseLiveAccount(reply);
  const token = user ? text(user, ["access_key"]) : "";
  if (!user || !account || !token) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  const { firstName, lastName } = getNameParts(text(user, ["fullname"]));
  const plan = account.subscription;

  return {
    token,
    account,
    user: {
      token,
      id: text(user, ["user_id"], "unknown-user"),
      email: text(user, ["email"], fallbackEmail),
      first_name: firstName,
      last_name: lastName,
      phone_number: text(user, ["mobile_no"]) || null,
      last_active: text(user, ["last_login_time"], new Date().toISOString()),
      role: "Student",
      status: text(user, ["status_name"], "Active"),
      middle_name: null,
      departmentId: plan?.departmentId || undefined,
      departmentName: plan?.departmentName || undefined,
      examId: plan?.classId || undefined,
      examAbbreviation: plan?.className || undefined,
    },
  };
};
