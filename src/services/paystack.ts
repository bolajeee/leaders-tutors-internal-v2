/**
 * Paystack Payment Service
 * Handles all Paystack payment integrations
 */

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo (multiply by 100)
  currency?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  onSuccess: (reference: string) => void;
  onClose: () => void;
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
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") return Promise.resolve();
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
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    window.setTimeout(() => config.onSuccess(generateReference()), 500);
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
