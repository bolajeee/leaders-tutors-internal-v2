/**
 * Paystack Payment Service
 * Handles all Paystack payment integrations
 */

import { isMockMode } from "@/lib/config";
import { requestMockCheckout } from "@/services/mock/checkout";

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo (multiply by 100)
  currency?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  /** Heading for the simulated checkout shown in mock mode. */
  label?: string;
  onSuccess: (reference: string) => void;
  /** The shopper closed the checkout without paying. */
  onClose: () => void;
  /** Payment was started but is not confirmed yet (mock mode only). */
  onPending?: (reference: string) => void;
}

export interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
  trxref: string;
}

/**
 * Load Paystack inline script dynamically
 */
export const loadPaystackScript = (): Promise<void> => {
  if (isMockMode()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Paystack can only be loaded in browser environment"));
      return;
    }

    // Check if already loaded
    if ((window as unknown as { PaystackPop?: unknown }).PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });
};

/**
 * Initialize Paystack payment popup
 */
export const initializePaystackPayment = (config: PaystackConfig): void => {
  if (isMockMode()) {
    const reference = generateReference();
    void requestMockCheckout({
      purpose: config.label ?? "Complete payment",
      email: config.email,
      amount: convertToNaira(config.amount),
    }).then((outcome) => {
      if (outcome === "paid") config.onSuccess(reference);
      else if (outcome === "pending") (config.onPending ?? config.onClose)(reference);
      else config.onClose();
    });
    return;
  }
  const windowWithPaystack = window as unknown as {
    PaystackPop?: { setup: (config: unknown) => { openIframe: () => void } };
  };

  if (typeof window === "undefined" || !windowWithPaystack.PaystackPop) {
    throw new Error("Paystack script not loaded");
  }

  const handler = windowWithPaystack.PaystackPop.setup({
    key: config.publicKey,
    email: config.email,
    amount: config.amount,
    currency: config.currency || "NGN",
    ref: config.reference || generateReference(),
    metadata: config.metadata,
    channels: config.channels || [
      "card",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
      "bank_transfer",
    ],
    callback: (response: PaystackResponse) => {
      config.onSuccess(response.reference);
    },
    onClose: () => {
      config.onClose();
    },
  });

  handler.openIframe();
};

/**
 * Generate unique payment reference
 */
export const generateReference = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `LT-${timestamp}-${random}`;
};

/**
 * Convert amount to kobo (Paystack uses kobo)
 */
export const convertToKobo = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert kobo to naira
 */
export const convertToNaira = (kobo: number): number => {
  return kobo / 100;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency = "NGN"): string => {
  const symbol = currency === "NGN" ? "₦" : currency;
  return `${symbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
