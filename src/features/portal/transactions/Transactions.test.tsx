import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Transactions from "./Transactions";
import * as payment from "@/services/payment";
import { useDemoStore } from "@/services/mock/demoStore";
import { renderWithQuery, resetAppState, signInAs } from "@/test/utils";

describe("transactions page", () => {
  beforeEach(() => {
    resetAppState();
    signInAs("active");
  });

  it("lists transactions with status badges", async () => {
    renderWithQuery(<Transactions />);
    const table = await screen.findByRole("table", { name: /payment and wallet transactions/i });
    expect(within(table).getByText("TRANS-DEMO-1001")).toBeInTheDocument();
    expect(within(table).getAllByText("Successful").length).toBeGreaterThan(0);
    expect(within(table).getByText("Cancelled")).toBeInTheDocument();
  });

  it("filters by status and by search text", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Transactions />);
    const table = await screen.findByRole("table");
    await user.selectOptions(screen.getByRole("combobox", { name: /filter by status/i }), "cancelled");
    expect(within(table).getByText("TRANS-DEMO-1003")).toBeInTheDocument();
    expect(within(table).queryByText("TRANS-DEMO-1001")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /filter by status/i }), "all");
    await user.type(screen.getByRole("searchbox", { name: /search transactions/i }), "wallet funding");
    expect(within(table).getByText("TRANS-DEMO-1002")).toBeInTheDocument();
    expect(within(table).queryByText("TRANS-DEMO-1001")).not.toBeInTheDocument();
  });

  it("explains when filters match nothing and clears them", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Transactions />);
    await screen.findByRole("table");
    await user.selectOptions(screen.getByRole("combobox", { name: /filter by status/i }), "failed");
    expect(await screen.findByRole("heading", { name: /no transactions match your filters/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("opens an accessible detail dialog with a receipt for a successful payment", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Transactions />);
    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: /details for TRANS-DEMO-1001/i }));
    const dialog = await screen.findByRole("dialog", { name: /transaction details/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("Student plan renewal")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /download receipt/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not offer a receipt for a cancelled payment", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Transactions />);
    const table = await screen.findByRole("table");
    await user.click(within(table).getByRole("button", { name: /details for TRANS-DEMO-1003/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /download receipt/i })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/receipt is available once a payment is successful/i)).toBeInTheDocument();
  });

  it("shows an empty state for a new account", async () => {
    useDemoStore.getState().seed("student@leaderstutors.com", "active", { fresh: true });
    renderWithQuery(<Transactions />);
    expect(await screen.findByRole("heading", { name: /no transactions yet/i })).toBeInTheDocument();
  });

  it("shows an error with retry instead of an empty history when loading fails", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(payment, "fetchUserTransactions").mockRejectedValueOnce(new Error("Network Error"));
    renderWithQuery(<Transactions />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/network error/i);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
