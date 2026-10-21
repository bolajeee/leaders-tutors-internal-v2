/** An API-shaped failure raised by mock services so screens handle both modes alike. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class PaymentCancelledError extends Error {
  constructor(message = "Payment was cancelled. No money was taken.") {
    super(message);
    this.name = "PaymentCancelledError";
  }
}

export class PaymentPendingError extends Error {
  constructor(message = "Your payment is still being confirmed.") {
    super(message);
    this.name = "PaymentPendingError";
  }
}

export class FeatureUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureUnavailableError";
  }
}

/** Best-effort readable message from an axios-interceptor rejection or an Error. */
export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};
