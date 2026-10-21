"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings2,
  UserRound,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CalendarDays,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { useAuthStore } from "@/store/authStore";
import { changePassword } from "@/services/settings";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color-light)] disabled:bg-slate-50 disabled:text-slate-400";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover-color)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary-color)] disabled:cursor-wait disabled:opacity-60";

export default function Settings() {
  const { user, token, userEnrollment, clearAuth } = useAuthStore();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setError("");
    setSuccess("");
    if (!oldPassword || !newPassword || !confirmation) {
      setError("Complete all three password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("The new passwords don't match.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("Choose a new password different from your current password.");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
        cnewPassword: confirmation,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmation("");
      setSuccess("Your password has been updated successfully.");
    } catch (failure) {
      const message = (failure as { message?: unknown })?.message;
      setError(
        typeof message === "string"
          ? message
          : "We couldn't update your password. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !token)
    return (
      <PortalWrapper>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <ShieldCheck className="mx-auto mb-5 h-10 w-10 text-[var(--primary-color)]" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Your account settings
          </h1>
          <p className="my-4 text-sm text-slate-500">
            Sign in to view your account and manage your password.
          </p>
          <Link href="/login" className={buttonClass}>
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PortalWrapper>
    );

  const details = [
    {
      label: "Full name",
      value: [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" "),
    },
    { label: "Email address", value: user.email },
    { label: "Phone number", value: user.phone_number },
    {
      label: "Examination",
      value: user.examAbbreviation || userEnrollment?.examAbbreviation,
    },
    {
      label: "Department",
      value: user.departmentName || userEnrollment?.departmentName,
    },
  ];

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
        <header className="mb-7">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]">
            <Settings2 className="h-4 w-4" />
            Your account
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your details, your security, and your learning account.
          </p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <nav
              aria-label="Settings sections"
              className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
            >
              {[
                { href: "#account", name: "Account details", icon: UserRound },
                {
                  href: "#security",
                  name: "Password & security",
                  icon: ShieldCheck,
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-[var(--primary-color)] focus-visible:outline-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Manage your learning
              </p>
              {[
                {
                  href: "/subscriptions",
                  name: "Subscriptions",
                  icon: CalendarDays,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center gap-2 text-sm text-slate-600 hover:text-[var(--primary-color)] focus-visible:outline-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </aside>
          <div className="min-w-0 space-y-6">
            <section
              id="account"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <span className="rounded-xl bg-indigo-50 p-2.5 text-[var(--primary-color)]">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Account details
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The details associated with your registration.
                  </p>
                </div>
              </div>
              <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
                {details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="text-xs text-slate-500">{detail.label}</dt>
                    <dd className="mt-2 break-words text-sm font-medium text-slate-900">
                      {detail.value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              id="security"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Change password
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Keep your account protected with a strong password.
                  </p>
                </div>
              </div>
              <form
                onSubmit={submitPassword}
                className="p-6"
                aria-busy={isSaving}
              >
                {error && (
                  <p
                    id="password-error"
                    role="alert"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
                  >
                    <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}
                {success && (
                  <p
                    role="status"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
                    {success}
                  </p>
                )}
                <fieldset
                  disabled={isSaving}
                  aria-describedby={error ? "password-error" : undefined}
                  className="space-y-5"
                >
                  <div className="max-w-md">
                    <label
                      htmlFor="current-password"
                      className="text-sm font-medium text-slate-700"
                    >
                      Current password
                    </label>
                    <input
                      id="current-password"
                      name="currentPassword"
                      type={showPasswords ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-password"
                        className="text-sm font-medium text-slate-700"
                      >
                        New password
                      </label>
                      <input
                        id="new-password"
                        name="newPassword"
                        type={showPasswords ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        aria-describedby="password-hint"
                        className={inputClass}
                      />
                      <p
                        id="password-hint"
                        className="mt-2 text-xs leading-5 text-slate-500"
                      >
                        At least 8 characters. Use a password you don&apos;t use
                        elsewhere.
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-slate-700"
                      >
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirmation}
                        onChange={(event) =>
                          setConfirmation(event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-pressed={showPasswords}
                    onClick={() => setShowPasswords((value) => !value)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {showPasswords ? "Hide passwords" : "Show passwords"}
                  </button>
                  <div className="border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={buttonClass}
                    >
                      {isSaving ? "Updating password…" : "Update password"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </fieldset>
              </form>
            </section>
            <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Sign out</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  End your session on this device.
                </p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  clearAuth();
                  router.replace("/login");
                }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </section>
          </div>
        </div>
      </div>
    </PortalWrapper>
  );
}
