"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarSync,
  GraduationCap,
  Play,
  Receipt,
  Settings2,
  Wallet,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { useAuthStore } from "@/store/authStore";
import WalletLoadModal from "@/components/wallet/WalletLoadModal";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { ProgressBar } from "@/components/ui";
import SubjectImage from "@/components/ui/SubjectImage";
import { EmptyPanel, ErrorState, ExpiredNotice, LoadingRows } from "@/components/ui/State";
import { useCurriculum, useSubscription } from "@/hooks/usePortalData";
import { countLessons } from "@/services/curriculum";
import { formatDate } from "@/utils/helpers";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover-color)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary-color)]";

const quickLink =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-800 hover:bg-slate-50 focus-visible:outline-2";

export default function Dashboard() {
  const { user, userEnrollment } = useAuthStore();
  const { subscription, access, refetch: refetchSubscription } = useSubscription();
  const curriculum = useCurriculum();
  const [showWallet, setShowWallet] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);

  const subjects = curriculum.data ?? [];
  const lessonCount = subjects.reduce((total, subject) => total + countLessons(subject), 0);
  const exam = user?.examAbbreviation || userEnrollment?.examAbbreviation;
  const department = user?.departmentName || userEnrollment?.departmentName;
  const loadingStats = access === "loading";

  const subscriptionValue =
    access === "loading"
      ? "Loading…"
      : access === "error"
        ? "Unavailable"
        : access === "active"
          ? `${subscription?.daysLeft ?? 0} day${subscription?.daysLeft === 1 ? "" : "s"} left`
          : "Expired";

  const stats = [
    {
      label: "Subscription",
      value: subscriptionValue,
      note:
        access === "active" && subscription
          ? `Active until ${formatDate(subscription.subscriptionExpiresAt)}`
          : access === "expired"
            ? "Renew to open lessons"
            : "Manage your learning access",
      icon: CalendarDays,
      color: "bg-indigo-50 text-indigo-700",
      href: "/subscriptions",
      link: "View subscription",
    },
    {
      label: "Wallet balance",
      value: subscription ? `${subscription.currency}${subscription.walletBalance.toLocaleString()}` : loadingStats ? "—" : "Unavailable",
      note: "Available in your wallet",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-800",
      href: "/transactions",
      link: "Payment history",
    },
    {
      label: "Course library",
      value: curriculum.isPending ? "—" : curriculum.isError ? "Unavailable" : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`,
      note: curriculum.isError ? "Retry to load your courses" : `${lessonCount} lesson${lessonCount === 1 ? "" : "s"} to explore`,
      icon: BookOpen,
      color: "bg-amber-50 text-amber-800",
      href: "/tutorials",
      link: "Explore tutorials",
    },
  ];

  return (
    <PortalWrapper>
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary-color)]">
              Your dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.first_name || "learner"}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Everything you need for your next learning session.
            </p>
          </div>
          <Link href="/tutorials" className={actionClass}>
            <Play className="h-4 w-4" aria-hidden />
            Explore lessons
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </header>

        {access === "error" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50">
            <ErrorState
              compact
              title="We couldn't check your subscription"
              message="Your lessons stay locked until we can confirm your access. Check your connection and try again."
              onRetry={() => void refetchSubscription()}
            />
          </div>
        )}

        {access === "expired" && (
          <div className="mb-6">
            <ExpiredNotice onRenew={() => setShowRenewal(true)} />
          </div>
        )}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Account overview">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-normal text-slate-600">{stat.label}</h2>
                <span className={`rounded-xl p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900" aria-live="polite">
                {stat.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{stat.note}</p>
              <Link
                href={stat.href}
                className="mt-5 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-[var(--primary-color)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {stat.link}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-labelledby="progress-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="progress-heading" className="text-lg font-semibold text-slate-900">
                  Your subjects
                </h2>
                <p className="mt-1 text-xs text-slate-600">Pick up where you left off.</p>
              </div>
              <Link href="/tutorials" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[var(--primary-color)] hover:underline">
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            {curriculum.isPending ? (
              <LoadingRows label="Loading your subjects" />
            ) : curriculum.isError ? (
              <ErrorState
                title="Your subjects couldn't be loaded"
                message={curriculum.error instanceof Error ? curriculum.error.message : "Please try again."}
                onRetry={() => void curriculum.refetch()}
              />
            ) : subjects.length === 0 ? (
              <EmptyPanel icon={BookOpen} title="Your library is on its way" message="New course content will appear here when it is available." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {subjects.slice(0, 5).map((subject) => {
                  const lessons = countLessons(subject);
                  return (
                    <li key={subject.id}>
                      <Link
                        href={`/tutorials?subject=${encodeURIComponent(subject.id)}`}
                        className="flex flex-col gap-3 px-6 py-5 hover:bg-slate-50 focus-visible:outline-2 sm:flex-row sm:items-center sm:gap-6"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-4">
                          <SubjectImage src={subject.imageUrl} className="h-12 w-16 rounded-xl" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{subject.name}</span>
                            <span className="block text-xs text-slate-600">
                              {lessons === 0 ? "Lessons coming soon" : `${lessons} lesson${lessons === 1 ? "" : "s"}`}
                            </span>
                          </span>
                        </span>
                        <span className="sm:w-48">
                          <span className="sr-only">{subject.progress}% complete</span>
                          <ProgressBar value={subject.progress} showLabel />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {subjects.length > 5 && (
              <p className="border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
                Showing 5 of {subjects.length} subjects. Explore tutorials to view the full library.
              </p>
            )}
          </section>

          <aside className="space-y-5" aria-label="Account shortcuts">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2.5 text-[var(--primary-color)]">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-semibold text-slate-900">Your class</h2>
              <p className="mt-3 text-xl font-semibold text-[var(--primary-color)]">{exam || "Your enrollment"}</p>
              <p className="mt-1 text-sm text-slate-600">{department || "View your account details in settings."}</p>
              <Link href="/settings#account" className="mt-5 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[var(--primary-color)]">
                Account details
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 px-1 font-semibold text-slate-900">Quick actions</h2>
              <button type="button" onClick={() => setShowRenewal(true)} className={quickLink}>
                <CalendarSync className="h-4 w-4 text-slate-500" aria-hidden />
                Renew access
                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" aria-hidden />
              </button>
              <button type="button" onClick={() => setShowWallet(true)} className={quickLink}>
                <Wallet className="h-4 w-4 text-slate-500" aria-hidden />
                Load wallet
                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" aria-hidden />
              </button>
              <Link href="/transactions" className={quickLink}>
                <Receipt className="h-4 w-4 text-slate-500" aria-hidden />
                Payment history
                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" aria-hidden />
              </Link>
              <Link href="/settings" className={quickLink}>
                <Settings2 className="h-4 w-4 text-slate-500" aria-hidden />
                Account settings
                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" aria-hidden />
              </Link>
            </section>
          </aside>
        </div>
      </div>
      <WalletLoadModal isOpen={showWallet} onClose={() => setShowWallet(false)} onSuccess={() => undefined} />
      <SubscriptionModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} />
    </PortalWrapper>
  );
}
