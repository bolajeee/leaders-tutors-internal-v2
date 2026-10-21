/**
 * A promise-based stand-in for the Paystack popup used in mock mode. The
 * `MockCheckoutHost` component renders the request and settles it with the
 * outcome the reviewer picks, which makes the success, cancelled and pending
 * payment paths testable without a real payment provider.
 */
export type MockCheckoutOutcome = "paid" | "cancelled" | "pending";

export interface MockCheckoutRequest {
  /** What the payment is for, shown inside the checkout. */
  purpose: string;
  email: string;
  amount: number;
}

interface ActiveCheckout {
  request: MockCheckoutRequest;
  resolve: (outcome: MockCheckoutOutcome) => void;
}

let active: ActiveCheckout | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export const requestMockCheckout = (request: MockCheckoutRequest) =>
  new Promise<MockCheckoutOutcome>((resolve) => {
    // A new checkout replaces a stale one rather than stacking dialogs.
    active?.resolve("cancelled");
    active = { request, resolve };
    notify();
  });

export const settleMockCheckout = (outcome: MockCheckoutOutcome) => {
  const current = active;
  active = null;
  notify();
  current?.resolve(outcome);
};

export const subscribeMockCheckout = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getActiveMockCheckout = () => active?.request ?? null;
