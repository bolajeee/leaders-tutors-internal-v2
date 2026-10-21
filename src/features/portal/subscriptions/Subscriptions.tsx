"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarSync, Download, Eye } from "lucide-react";
import Link from "next/link";
import { PortalWrapper } from "../PortalWrapper";
import { Button } from "@/components/form";
import WalletLoadModal from "@/components/wallet/WalletLoadModal";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { useAuthStore } from "@/store/authStore";
import {
  fetchDashboardSummary,
  fetchUserSubscription,
} from "@/services/portal";
import { fetchUserTransactions, WalletTransaction } from "@/services/payment";
import { DashboardSummary, UserSubscription } from "@/types/portal";
import { formatDate, formatTime } from "@/utils/helpers";

type SubscriptionRow = {
  sn: number;
  subscriptionId: string;
  department: string;
  className: string;
  subscriptionDate: string;
  dueDate: string;
  status: "active" | "expired" | "pending";
};

const statusStyles: Record<SubscriptionRow["status"], string> = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  expired: "bg-red-50 text-red-600 border border-red-100",
};

const addDays = (iso: string, days: number) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getSubscriptionStatus = (
  dueDateIso: string,
  txStatus: WalletTransaction["status"],
): SubscriptionRow["status"] => {
  if (txStatus === "pending") return "pending";
  if (txStatus === "failed" || txStatus === "cancelled") return "expired";
  return new Date(dueDateIso) > new Date() ? "active" : "expired";
};

export default function Subscriptions() {
  const { user, token } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary>({
    subscriptionExpiresIn: 0,
    walletBalance: 0,
    currency: "₦",
    subscriptionStatus: "expired",
    subscriptionType: "basic",
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [departmentName, setDepartmentName] = useState("BASIC");
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true);
        if (!token || !user) {
          setTransactions([]);
          return;
        }

        const [dashboardData, transactionData, subscription] =
          await Promise.all([
            fetchDashboardSummary().catch(() => ({
              subscriptionExpiresIn: 0,
              walletBalance: 0,
              currency: "₦",
              subscriptionStatus: "expired" as const,
              subscriptionType: "basic",
            })),
            fetchUserTransactions(),
            fetchUserSubscription().catch(() => null),
          ]);

        setSummary(dashboardData);
        setTransactions(
          transactionData.filter(
            (transaction) =>
              transaction.type === "subscription" ||
              transaction.type === "exam_payment",
          ),
        );
        setCurrentSubscription(subscription);
        if (subscription?.departmentName) {
          setDepartmentName(subscription.departmentName.toUpperCase());
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [token, user]);

  const userName = user
    ? `${user.first_name} ${user.last_name}`
    : "Student User";
  const userRole = user?.role || "STUDENT";

  const rows = useMemo<SubscriptionRow[]>(() => {
    const historyRows = transactions.map((transaction, index) => {
      const subscriptionDateIso = transaction.createdAt;
      const dueDateIso = addDays(subscriptionDateIso, 30);

      return {
        sn: index + 1,
        subscriptionId: transaction.id,
        department: departmentName,
        className: `${(summary.subscriptionType || "basic").toUpperCase()} 1`,
        subscriptionDate: `${formatDate(subscriptionDateIso)} ${formatTime(subscriptionDateIso)}`,
        dueDate: `${formatDate(dueDateIso)} ${formatTime(dueDateIso)}`,
        status: getSubscriptionStatus(dueDateIso, transaction.status),
      };
    });

    if (!currentSubscription?.departmentId && !currentSubscription?.examId) {
      return historyRows.map((row, index) => ({ ...row, sn: index + 1 }));
    }

    const liveRow: SubscriptionRow = {
      sn: 1,
      subscriptionId:
        currentSubscription.examId ||
        currentSubscription.departmentId ||
        "current-subscription",
      department: (
        currentSubscription.departmentName || departmentName
      ).toUpperCase(),
      className: `${(currentSubscription.subscriptionType || "basic").toUpperCase()}`,
      subscriptionDate: currentSubscription.lastPaymentDate
        ? `${formatDate(currentSubscription.lastPaymentDate)} ${formatTime(currentSubscription.lastPaymentDate)}`
        : "—",
      dueDate: `${formatDate(currentSubscription.subscriptionExpiresAt)} ${formatTime(currentSubscription.subscriptionExpiresAt)}`,
      status: currentSubscription.isSubscriptionActive ? "active" : "expired",
    };

    const withoutDuplicate = historyRows.filter(
      (row) => row.subscriptionId !== liveRow.subscriptionId,
    );

    return [liveRow, ...withoutDuplicate].map((row, index) => ({
      ...row,
      sn: index + 1,
    }));
  }, [
    transactions,
    departmentName,
    summary.subscriptionType,
    currentSubscription,
  ]);

  const handleWalletLoadSuccess = () => {
    fetchDashboardSummary()
      .then(setSummary)
      .catch(() => null);
  };

  if (!token || !user) {
    return (
      <PortalWrapper>
        <section className="px-6 py-20">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="mb-6">
              <div className="p-4 bg-[var(--primary-color-light)] rounded-full text-[var(--primary-color)] mb-4 inline-block">
                <CalendarSync className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--title-color)] font-bold-custom mb-2">
                Subscription History
              </h2>
              <p className="text-[var(--text-color)] text-lg mb-6">
                Please log in to view your subscription activity.
              </p>
            </div>
            <Link href="/login">
              <Button text="Go to Login" variant="primary" className="px-8" />
            </Link>
          </div>
        </section>
      </PortalWrapper>
    );
  }

  return (
    <PortalWrapper>
      <section className="px-6 py-6 bg-white border-b border-[var(--border-color)]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[var(--secondary-color-light)] rounded-xl text-[var(--secondary-color)] shadow-sm">
            <CalendarSync className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[var(--title-color)] font-bold-custom">
              Subscription History
            </h1>
          </div>
        </div>
      </section>

      <section className="px-4 pt-4 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--border-color-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center text-white text-xs font-semibold font-medium-custom">
              {userName
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--title-color)] capitalize font-medium-custom">
                {userName.toLowerCase()}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary-color)] uppercase tracking-tighter">
                {userRole}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 items-end gap-4 md:flex md:w-auto md:items-center md:gap-6">
            <div className="text-left md:text-right">
              <p className="text-[10px] text-[var(--text-secondary-color)] uppercase tracking-wider">
                Subscription expires in
              </p>
              <p className="whitespace-nowrap text-xl font-bold text-[var(--title-color)] font-medium-custom sm:text-2xl">
                {summary.subscriptionExpiresIn} Day(s)
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] text-[var(--text-secondary-color)] uppercase tracking-wider">
                Wallet Balance
              </p>
              <p className="text-sm font-bold text-[var(--text-green)] font-medium-custom">
                {summary.currency}
                {summary.walletBalance.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 flex gap-2 md:col-span-1">
              <Button
                text="Renew"
                size="sm"
                variant="secondary"
                onClick={() => setShowRenewalModal(true)}
              />
              <Button
                text="Load Wallet"
                size="sm"
                fullWidth
                className="md:w-auto"
                onClick={() => setShowWalletModal(true)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 font-regular-custom sm:px-6">
        <div className="bg-white rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
          <div className="flex flex-col items-stretch gap-3 border-b border-[var(--border-color)] bg-[var(--gray-color)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-sm font-bold text-[var(--head-color)] uppercase tracking-wide font-bold-custom">
              Subscription History
            </h2>
            <Button
              text="Download"
              size="sm"
              fullWidth
              className="sm:w-auto"
              frontIcon={<Download size={14} />}
            />
          </div>

          <div className="divide-y divide-[var(--border-color-light)] md:hidden">
            {isLoading ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary-color)]">
                Loading subscription history...
              </p>
            ) : rows.length ? (
              rows.map((row) => (
                <article key={row.subscriptionId} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary-color)]">
                        Subscription #{row.sn}
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-[var(--title-color)]">
                        {row.subscriptionId}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${statusStyles[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-secondary-color)]">
                        Department
                      </dt>
                      <dd className="mt-1 font-medium text-[var(--title-color)]">
                        {row.department}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-secondary-color)]">
                        Class
                      </dt>
                      <dd className="mt-1 font-medium text-[var(--title-color)]">
                        {row.className}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-secondary-color)]">
                        Subscription date
                      </dt>
                      <dd className="mt-1 leading-5 text-[var(--title-color)]">
                        {row.subscriptionDate}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-secondary-color)]">
                        Due date
                      </dt>
                      <dd className="mt-1 leading-5 text-[var(--title-color)]">
                        {row.dueDate}
                      </dd>
                    </div>
                  </dl>
                  <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold uppercase text-[var(--title-color)] transition hover:bg-slate-200">
                    <Eye size={14} />
                    View details
                  </button>
                </article>
              ))
            ) : (
              <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary-color)]">
                No subscription records found.
              </p>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-[var(--text-secondary-color)] bg-white">
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-6 py-4 text-left">SN</th>
                  <th className="px-6 py-4 text-left">Subscription ID</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Class</th>
                  <th className="px-6 py-4 text-left">Subscription Date</th>
                  <th className="px-6 py-4 text-left">Due Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-[var(--text-secondary-color)]"
                      colSpan={8}
                    >
                      Loading subscription history...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={row.subscriptionId}
                      className="border-b border-[var(--border-color-light)]"
                    >
                      <td className="px-6 py-4">{row.sn}</td>
                      <td className="px-6 py-4">{row.subscriptionId}</td>
                      <td className="px-6 py-4">{row.department}</td>
                      <td className="px-6 py-4">{row.className}</td>
                      <td className="px-6 py-4">{row.subscriptionDate}</td>
                      <td className="px-6 py-4">{row.dueDate}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase font-semibold ${statusStyles[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="px-3 py-1.5 text-[10px] uppercase rounded-md bg-slate-100 hover:bg-slate-200 text-[var(--title-color)] inline-flex items-center gap-1">
                          <Eye size={12} />
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-[var(--text-secondary-color)]"
                      colSpan={8}
                    >
                      No subscription records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 text-xs text-[var(--text-secondary-color)]">
            1 of {Math.max(rows.length, 1)}
          </div>
        </div>
      </section>

      <WalletLoadModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletLoadSuccess}
      />
      <SubscriptionModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSuccess={() => {
          setShowRenewalModal(false);
          void fetchDashboardSummary().then(setSummary);
        }}
      />
    </PortalWrapper>
  );
}
