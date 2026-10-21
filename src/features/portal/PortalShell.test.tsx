import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./dashboard/Dashboard";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { nav } from "@/test/navigation";
import { renderWithCheckout, renderWithQuery, resetAppState, signInAs } from "@/test/utils";

describe("portal route guard", () => {
  beforeEach(resetAppState);

  it("sends a signed-out visitor to login with a return path and shows no portal content", async () => {
    nav.pathname = "/tutorials";
    renderWithQuery(<Dashboard />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/login?next=%2Ftutorials"));
    expect(screen.queryByRole("navigation", { name: /student portal/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    expect(screen.getByText(/restoring session/i)).toBeInTheDocument();
  });

  it("renders the portal shell for a signed-in student", async () => {
    signInAs("active");
    renderWithQuery(<Dashboard />);
    expect(await screen.findByRole("navigation", { name: /student portal/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute("href", "#portal-content");
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("labels the demo data so it is never mistaken for real content", async () => {
    signInAs("active");
    renderWithQuery(<Dashboard />);
    expect(await screen.findByRole("note")).toHaveTextContent(/demo mode/i);
  });

  it("marks the current page in the sidebar", async () => {
    signInAs("active");
    nav.pathname = "/dashboard";
    renderWithQuery(<Dashboard />);
    const sidebar = await screen.findByRole("navigation", { name: /student portal/i });
    expect(within(sidebar).getByRole("link", { name: /dashboard/i })).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: /tutorials/i })).not.toHaveAttribute("aria-current");
  });

  it("logs out from the sidebar and returns to login", async () => {
    const user = userEvent.setup();
    signInAs("active");
    renderWithQuery(<Dashboard />);
    await user.click(await screen.findByRole("button", { name: /log-out/i }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(nav.push).toHaveBeenCalledWith("/login");
  });
});

describe("profile menu", () => {
  beforeEach(() => {
    resetAppState();
    signInAs("active");
  });

  it("opens with profile, settings and logout, and closes on Escape returning focus", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Dashboard />);
    const trigger = await screen.findByRole("button", { name: /account menu for demo student|demo student/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const menu = await screen.findByRole("menu", { name: /account/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getByRole("menuitem", { name: /my profile/i })).toHaveAttribute("href", "/settings#account");
    expect(within(menu).getByRole("menuitem", { name: /settings/i })).toHaveAttribute("href", "/settings");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("logs out from the menu", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Dashboard />);
    await user.click(await screen.findByRole("button", { name: /demo student/i }));
    await user.click(await screen.findByRole("menuitem", { name: /log out/i }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(nav.push).toHaveBeenCalledWith("/login");
  });
});

describe("notification control", () => {
  beforeEach(() => {
    resetAppState();
    useNotificationStore.setState({ readIds: [] });
  });

  it("shows an all-caught-up state for a healthy account", async () => {
    const user = userEvent.setup();
    signInAs("active");
    renderWithQuery(<Dashboard />);
    await user.click(await screen.findByRole("button", { name: /^notifications$/i }));
    expect(await screen.findByText(/you're all caught up/i)).toBeInTheDocument();
  });

  it("flags an expired subscription, links to it and can be marked read", async () => {
    const user = userEvent.setup();
    signInAs("expired");
    renderWithQuery(<Dashboard />);
    const trigger = await screen.findByRole("button", { name: /notifications, 1 unread/i });
    await user.click(trigger);
    const item = await screen.findByRole("link", { name: /your learning access has expired/i });
    expect(item).toHaveAttribute("href", "/subscriptions");

    await user.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(await screen.findByRole("button", { name: /^notifications$/i })).toBeInTheDocument();
  });
});

describe("dashboard", () => {
  beforeEach(resetAppState);

  it("greets the student and summarises an active plan, wallet and subjects", async () => {
    signInAs("active");
    renderWithQuery(<Dashboard />);
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back, demo/i })).toBeInTheDocument();
    const overview = screen.getByRole("region", { name: /account overview/i });
    expect(await within(overview).findByText("30 days left")).toBeInTheDocument();
    expect(within(overview).getByText("₦9,000")).toBeInTheDocument();
    expect(await within(overview).findByText(/4 subjects/)).toBeInTheDocument();
    expect(screen.queryByText(/your learning access has expired/i)).not.toBeInTheDocument();

    const subjects = await screen.findByRole("region", { name: /your subjects/i });
    expect(within(subjects).getByRole("link", { name: /basic science/i })).toHaveAttribute(
      "href",
      "/tutorials?subject=basic-science",
    );
    expect(within(subjects).getAllByRole("progressbar").length).toBeGreaterThan(0);
  });

  it("shows expired-subscription messaging with a renewal action", async () => {
    const user = userEvent.setup();
    signInAs("expired");
    renderWithQuery(<Dashboard />);
    expect(await screen.findByText(/your learning access has expired/i)).toBeInTheDocument();
    const overview = screen.getByRole("region", { name: /account overview/i });
    expect(await within(overview).findByText("Expired")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /renew access/i })[0]);
    expect(await screen.findByRole("dialog", { name: /renew learning access/i })).toBeInTheDocument();
  });

  it("loads the wallet from a quick action", async () => {
    const user = userEvent.setup();
    signInAs("active");
    renderWithCheckout(<Dashboard />);
    await user.click(await screen.findByRole("button", { name: /load wallet/i }));
    const dialog = await screen.findByRole("dialog", { name: /load wallet/i });
    await user.click(within(dialog).getByRole("button", { name: "₦1,000" }));
    await user.click(within(dialog).getByRole("button", { name: /continue to payment/i }));
    await user.click(await screen.findByRole("button", { name: /^pay ₦1,000$/i }));
    expect(await screen.findByRole("heading", { name: /wallet loaded/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /done/i }));
    const overview = screen.getByRole("region", { name: /account overview/i });
    expect(await within(overview).findByText("₦10,000")).toBeInTheDocument();
  });
});
