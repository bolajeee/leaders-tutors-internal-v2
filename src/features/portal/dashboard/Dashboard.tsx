"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Wallet,
  Play,
  Settings2,
  Receipt,
  AlertCircle,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { useAuthStore } from "@/store/authStore";
import {
  fetchSubjectsWithVideos,
  fetchUserSubscription,
} from "@/services/portal";
import { SubjectWithVideos, UserSubscription } from "@/types/portal";
import WalletLoadModal from "@/components/wallet/WalletLoadModal";
import ClassVideosModal from "@/components/tutorial/ClassVideosModal";
import SubjectList from "@/features/portal/tutorials/SubjectList";
import { getCurriculumRepository, isMockCurriculum } from "@/services/curriculum";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover-color)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary-color)]";

export default function Dashboard() {
  const { user, token, userEnrollment } = useAuthStore();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [subjects, setSubjects] = useState<SubjectWithVideos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedSubject, setSelectedSubject] =
    useState<SubjectWithVideos | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || !user) return;
      setIsLoading(true);
      setError("");
      setSubjects([]);
      setSubscription(null);
      try {
        if (isMockCurriculum()) {
          const catalog = await getCurriculumRepository().getSubjects();
          if (cancelled) return;
          setSubscription({
            isSubscriptionActive: true,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            subscriptionType: "Student plan",
            walletBalance: 9000,
            currency: "₦",
            departmentId: userEnrollment?.departmentId ?? "basic",
            departmentName: userEnrollment?.departmentName ?? "Basic",
            examId: userEnrollment?.examId ?? "basic-5",
            examAbbreviation: userEnrollment?.examAbbreviation ?? "Basic 5",
            daysLeft: 30,
            statusName: "ACTIVE",
          });
          setSubjects(catalog.map((subject) => ({
            subjectId: subject.id,
            subjectName: subject.name,
            departmentId: userEnrollment?.departmentId ?? "basic",
            examId: userEnrollment?.examId ?? "basic-5",
            yearGroups: subject.terms.map((term) => ({
              yearId: term.id,
              yearLabel: term.label,
              videos: term.weeks.flatMap((week) => week.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, year: term.label, yearId: term.id, duration: lesson.duration, subjectId: subject.id, description: lesson.summary, thumbnailUrl: lesson.thumbnailUrl }))),
            })),
          })));
          return;
        }
        const current = await fetchUserSubscription();
        if (cancelled) return;
        setSubscription(current);
        if (current.isSubscriptionActive) {
          const courses = await fetchSubjectsWithVideos();
          if (!cancelled) setSubjects(courses);
        }
      } catch {
        if (!cancelled)
          setError("We couldn't load your dashboard. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, user, retry, userEnrollment]);

  if (!user || !token)
    return (
      <PortalWrapper>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <BookOpen className="mx-auto mb-5 h-10 w-10 text-[var(--primary-color)]" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Your learning starts here
          </h1>
          <p className="my-4 text-sm leading-6 text-slate-500">
            Sign in to explore your courses and manage your account.
          </p>
          <Link href="/login" className={actionClass}>
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PortalWrapper>
    );

  const active = subscription?.isSubscriptionActive;
  const lessons = subjects.reduce(
    (sum, subject) =>
      sum +
      subject.yearGroups.reduce((total, year) => total + year.videos.length, 0),
    0,
  );
  const exam = user.examAbbreviation || userEnrollment?.examAbbreviation;
  const department = user.departmentName || userEnrollment?.departmentName;
  const stats = [
    {
      label: "Subscription",
      value: isLoading
        ? "Loading…"
        : subscription
          ? active
            ? `${subscription.daysLeft ?? 0} days left`
            : "Inactive"
          : "Unavailable",
      note: active
        ? "Your learning access is active"
        : "Manage your learning access",
      icon: CalendarDays,
      color: "bg-indigo-50 text-indigo-700",
      href: "/subscriptions",
      link: "View subscription",
    },
    {
      label: "Wallet balance",
      value: isLoading
        ? "—"
        : subscription
          ? `${subscription.currency}${subscription.walletBalance.toLocaleString()}`
          : "—",
      note: "Available in your wallet",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-700",
      href: "/subscriptions",
      link: "Payment history",
    },
    {
      label: "Your course library",
      value: isLoading
        ? "—"
        : error
          ? "Unavailable"
          : `${subjects.length} subjects`,
      note: error
        ? "Retry to load your courses"
        : `${lessons} video lesson${lessons !== 1 ? "s" : ""} to explore`,
      icon: BookOpen,
      color: "bg-amber-50 text-amber-700",
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
              Welcome back, {user.first_name || "learner"}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Everything you need for your next learning session.
            </p>
          </div>
          <Link href="/tutorials" className={actionClass}>
            <Play className="h-4 w-4" />
            Explore lessons
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold hover:bg-amber-100 focus-visible:outline-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}
        <section
          className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Account overview"
        >
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`rounded-xl p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p
                className="text-2xl font-semibold tracking-tight text-slate-900"
                aria-live="polite"
              >
                {stat.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stat.note}
              </p>
              <Link
                href={stat.href}
                className="mt-5 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-[var(--primary-color)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {stat.link}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </section>
        {!isLoading && subscription && !active && (
          <section className="mb-7 flex flex-col gap-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Ready for your next lesson?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Activate your subscription to access your course content.
              </p>
            </div>
            <Link href="/subscriptions" className={`${actionClass} shrink-0`}>
              Manage subscription
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Your courses
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a subject and make your next step count.
                </p>
              </div>
              <Link
                href="/tutorials"
                className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[var(--primary-color)] hover:underline focus-visible:outline-2"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <SubjectList
              subjects={subjects.slice(0, 5)}
              isLoading={isLoading}
              onViewContent={setSelectedSubject}
              emptyMessage={
                error
                  ? "Your courses couldn't be loaded. Use the retry button above."
                  : active
                    ? "New course content will appear here when available."
                    : "Your courses will be available with an active subscription."
              }
            />
            {subjects.length > 5 && (
              <p className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                Showing 5 of {subjects.length} subjects. Explore tutorials to
                view the full library.
              </p>
            )}
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2.5 text-[var(--primary-color)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-slate-900">Your examination</h2>
              <p className="mt-3 text-xl font-semibold text-[var(--primary-color)]">
                {exam || "Your enrollment"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {department || "View your account details in settings."}
              </p>
              <Link
                href="/settings"
                className="mt-5 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[var(--primary-color)] focus-visible:outline-2"
              >
                Account details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 px-1 font-semibold text-slate-900">
                Quick actions
              </h2>
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2"
              >
                <Wallet className="h-4 w-4 text-slate-400" />
                Add to wallet
                <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
              </button>
              {[
                {
                  href: "/subscriptions",
                  text: "Payment history",
                  icon: Receipt,
                },
                {
                  href: "/settings",
                  text: "Account settings",
                  icon: Settings2,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  {item.text}
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </section>
          </aside>
        </div>
      </div>
      <WalletLoadModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => setRetry((value) => value + 1)}
      />
      <ClassVideosModal
        key={selectedSubject?.subjectId ?? "closed"}
        isOpen={!!selectedSubject}
        subject={selectedSubject}
        onClose={() => setSelectedSubject(null)}
      />
    </PortalWrapper>
  );
}
