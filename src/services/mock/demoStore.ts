import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WalletTransaction } from "@/types/payment";
import { SUBSCRIPTION_PRICE } from "@/lib/config";

const DAY = 86_400_000;

export type DemoScenario = "active" | "expired";

interface DemoState {
  accountEmail: string | null;
  subscriptionEndsAt: string | null;
  walletBalance: number;
  transactions: WalletTransaction[];
  seed: (email: string, scenario: DemoScenario, options?: { fresh?: boolean }) => void;
  ensureAccount: (email: string) => void;
  recordTransaction: (transaction: WalletTransaction) => void;
  settleTransaction: (id: string, status: WalletTransaction["status"]) => void;
  renew: (days?: number) => void;
  creditWallet: (amount: number) => void;
  reset: () => void;
}

export const scenarioForEmail = (email: string): DemoScenario =>
  /expired/i.test(email) ? "expired" : "active";

const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const fixtures = (scenario: DemoScenario): WalletTransaction[] => [
  ...(scenario === "active"
    ? [
        { id: "TRANS-DEMO-1001", amount: SUBSCRIPTION_PRICE.amount, currency: "₦", status: "success", type: "subscription", createdAt: daysAgo(2), description: "Student plan renewal" } as const,
      ]
    : []),
  { id: "TRANS-DEMO-1002", amount: 10000, currency: "₦", status: "success", type: "load_wallet", createdAt: daysAgo(scenario === "active" ? 6 : 40), description: "Wallet funding" },
  { id: "TRANS-DEMO-1003", amount: SUBSCRIPTION_PRICE.amount, currency: "₦", status: "cancelled", type: "subscription", createdAt: daysAgo(scenario === "active" ? 30 : 12), description: "Subscription payment" },
  ...(scenario === "expired"
    ? [
        { id: "TRANS-DEMO-0999", amount: SUBSCRIPTION_PRICE.amount, currency: "₦", status: "success", type: "subscription", createdAt: daysAgo(35), description: "Student plan renewal" } as const,
      ]
    : []),
];

const initial = {
  accountEmail: null,
  subscriptionEndsAt: null,
  walletBalance: 0,
  transactions: [] as WalletTransaction[],
};

const sortNewest = (items: WalletTransaction[]) =>
  [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

/**
 * Local persistence for mock mode. It stands in for the server so renewal,
 * wallet loading and expiry can be exercised end to end without credentials.
 */
export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...initial,
      seed: (email, scenario, options) =>
        set({
          accountEmail: email,
          subscriptionEndsAt: new Date(
            Date.now() + (scenario === "active" ? SUBSCRIPTION_PRICE.days : -5) * DAY,
          ).toISOString(),
          walletBalance: options?.fresh ? 0 : scenario === "active" ? 9000 : 500,
          transactions: options?.fresh ? [] : sortNewest(fixtures(scenario)),
        }),
      ensureAccount: (email) => {
        if (get().accountEmail !== email) get().seed(email, scenarioForEmail(email));
      },
      recordTransaction: (transaction) =>
        set((state) => ({ transactions: sortNewest([transaction, ...state.transactions]) })),
      settleTransaction: (id, status) =>
        set((state) => ({
          transactions: state.transactions.map((item) => (item.id === id ? { ...item, status } : item)),
        })),
      renew: (days = SUBSCRIPTION_PRICE.days) =>
        set((state) => {
          const current = state.subscriptionEndsAt ? +new Date(state.subscriptionEndsAt) : 0;
          return { subscriptionEndsAt: new Date(Math.max(current, Date.now()) + days * DAY).toISOString() };
        }),
      creditWallet: (amount) => set((state) => ({ walletBalance: state.walletBalance + amount })),
      reset: () => set({ ...initial }),
    }),
    { name: "lt-demo-state" },
  ),
);

export const daysUntil = (iso: string | null, now = Date.now()) =>
  iso ? Math.max(0, Math.ceil((+new Date(iso) - now) / DAY)) : 0;
