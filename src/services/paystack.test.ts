import { afterEach, describe, expect, it, vi } from "vitest";
import { convertToKobo, convertToNaira, formatAmount, initializePaystackPayment } from "./paystack";
import { getActiveMockCheckout, settleMockCheckout } from "./mock/checkout";

const config = () => ({
  publicKey: "pk_test",
  email: "ada@example.com",
  amount: convertToKobo(1000),
  onSuccess: vi.fn(),
  onClose: vi.fn(),
  onPending: vi.fn(),
});

describe("payment callbacks (mock checkout)", () => {
  afterEach(() => settleMockCheckout("cancelled"));

  it("opens the simulated checkout with the amount in naira", () => {
    initializePaystackPayment(config());
    expect(getActiveMockCheckout()).toMatchObject({ email: "ada@example.com", amount: 1000 });
  });

  it("calls onSuccess with a reference when paid", async () => {
    const callbacks = config();
    initializePaystackPayment(callbacks);
    settleMockCheckout("paid");
    await vi.waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalledTimes(1));
    expect(callbacks.onSuccess.mock.calls[0][0]).toMatch(/^LT-/);
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it("calls onClose, not onSuccess, when cancelled", async () => {
    const callbacks = config();
    initializePaystackPayment(callbacks);
    settleMockCheckout("cancelled");
    await vi.waitFor(() => expect(callbacks.onClose).toHaveBeenCalledTimes(1));
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
  });

  it("calls onPending when confirmation is outstanding", async () => {
    const callbacks = config();
    initializePaystackPayment(callbacks);
    settleMockCheckout("pending");
    await vi.waitFor(() => expect(callbacks.onPending).toHaveBeenCalledTimes(1));
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
  });

  it("treats pending as a close when the caller has no pending handler", async () => {
    const callbacks = { ...config(), onPending: undefined };
    initializePaystackPayment(callbacks);
    settleMockCheckout("pending");
    await vi.waitFor(() => expect(callbacks.onClose).toHaveBeenCalledTimes(1));
  });
});

describe("amount helpers", () => {
  it("converts between naira and kobo", () => {
    expect(convertToKobo(1000.5)).toBe(100050);
    expect(convertToNaira(100050)).toBe(1000.5);
  });

  it("formats naira amounts", () => {
    expect(formatAmount(1000)).toBe("₦1,000.00");
  });
});
