import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Subscriptions from "./Subscriptions";
import MockCheckoutHost from "@/components/payment/MockCheckoutHost";
import { useDemoStore, daysUntil } from "@/services/mock/demoStore";
import { renderWithQuery, resetAppState, signInAs } from "@/test/utils";

const renderPage = () =>
  renderWithQuery(
    <>
      <Subscriptions />
      <MockCheckoutHost />
    </>,
  );

describe("subscriptions page", () => {
  beforeEach(resetAppState);

  it("shows an active plan with expiry, time remaining and wallet balance", async () => {
    signInAs("active");
    renderPage();
    const plan = await screen.findByRole("region", { name: /student plan/i });
    expect(within(plan).getByText("Active")).toBeInTheDocument();
    expect(within(plan).getByText("30 days")).toBeInTheDocument();
    expect(within(plan).getByText("₦9,000")).toBeInTheDocument();
    expect(within(plan).getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows an expired plan with a clear message", async () => {
    signInAs("expired");
    renderPage();
    const plan = await screen.findByRole("region", { name: /student plan/i });
    expect(within(plan).getByText("Expired")).toBeInTheDocument();
    expect(within(plan).getByText(/your access has expired/i)).toBeInTheDocument();
  });

  it("lists subscription payments and opens their details", async () => {
    const user = userEvent.setup();
    signInAs("active");
    renderPage();
    const table = await screen.findByRole("table", { name: /subscription payments/i });
    expect(within(table).queryByText("TRANS-DEMO-1002")).not.toBeInTheDocument(); // wallet funding is not a subscription payment
    await user.click(within(table).getByRole("button", { name: /view details for TRANS-DEMO-1001/i }));
    expect(await screen.findByRole("dialog", { name: /transaction details/i })).toBeInTheDocument();
  });

  describe("renewal", () => {
    beforeEach(() => signInAs("expired"));

    /** Opens the renewal dialog and continues to the simulated Paystack checkout. */
    const startRenewal = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await screen.findByRole("button", { name: /^renew access$/i }));
      const dialog = await screen.findByRole("dialog", { name: /renew learning access/i });
      await user.click(within(dialog).getByRole("button", { name: /proceed/i }));
      return screen.findByRole("dialog", { name: /paystack checkout/i });
    };

    it("completes a successful payment and reactivates access", async () => {
      const user = userEvent.setup();
      renderPage();
      await startRenewal(user);
      const checkout = await screen.findByRole("dialog", { name: /renew learning access/i, hidden: false });
      expect(checkout).toBeInTheDocument();
      await user.click(await screen.findByRole("button", { name: /^pay ₦1,000$/i }));

      expect(await screen.findByRole("heading", { name: /access renewed/i })).toBeInTheDocument();
      expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBeGreaterThanOrEqual(29);

      await user.click(screen.getByRole("button", { name: /continue learning/i }));
      const plan = await screen.findByRole("region", { name: /student plan/i });
      expect(await within(plan).findByText("Active")).toBeInTheDocument();
    });

    it("explains a cancelled payment and allows another attempt", async () => {
      const user = userEvent.setup();
      renderPage();
      const checkout = await startRenewal(user);
      await user.click(within(checkout).getByRole("button", { name: /^cancel payment$/i }));

      expect(await screen.findByRole("heading", { name: /payment cancelled/i })).toBeInTheDocument();
      expect(screen.getByText(/no money was taken/i)).toBeInTheDocument();
      expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(0);
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("reports a pending payment without granting access", async () => {
      const user = userEvent.setup();
      renderPage();
      const checkout = await startRenewal(user);
      await user.click(within(checkout).getByRole("button", { name: /simulate pending confirmation/i }));

      expect(await screen.findByRole("heading", { name: /payment pending/i })).toBeInTheDocument();
      expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(0);
      expect(screen.getByRole("link", { name: /view in transactions/i })).toHaveAttribute("href", "/transactions");
    });
  });

  it("disables renewal and says why when the API has no renewal endpoint", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH", "");
    signInAs("expired");
    const portal = await import("@/services/portal");
    vi.spyOn(portal, "fetchUserSubscription").mockResolvedValue({
      ...portal.inactiveSubscription(),
      departmentName: "Basic",
      examAbbreviation: "Basic 5",
    });
    const payment = await import("@/services/payment");
    vi.spyOn(payment, "fetchUserTransactions").mockResolvedValue([]);
    renderPage();

    const renew = await screen.findByRole("button", { name: /^renew access$/i });
    expect(renew).toBeDisabled();
    expect(renew).toHaveAccessibleDescription(/online renewal is not enabled/i);
  });

  it("offers a retry when the plan cannot be loaded", async () => {
    signInAs("active");
    const portal = await import("@/services/portal");
    vi.spyOn(portal, "fetchUserSubscription").mockRejectedValueOnce(new Error("Network Error"));
    renderPage();
    expect(await screen.findByRole("heading", { name: /your plan couldn't be loaded/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
