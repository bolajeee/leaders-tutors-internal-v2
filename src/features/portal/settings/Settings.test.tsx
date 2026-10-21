import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "./Settings";
import { useAuthStore } from "@/store/authStore";
import { MOCK_WRONG_PASSWORD } from "@/services/mock/directory";
import { nav } from "@/test/navigation";
import { renderWithQuery, resetAppState, signInAs } from "@/test/utils";

type User = ReturnType<typeof userEvent.setup>;

const fill = async (user: User, current: string, next: string, confirmation: string) => {
  await user.type(await screen.findByLabelText("Current password"), current);
  await user.type(screen.getByLabelText("New password"), next);
  await user.type(screen.getByLabelText("Confirm new password"), confirmation);
};

describe("settings", () => {
  beforeEach(() => {
    resetAppState();
    signInAs("active");
  });

  it("shows the student's account details", async () => {
    renderWithQuery(<Settings />);
    const detail = async (term: string) => (await screen.findByText(term, { selector: "dt" })).nextElementSibling;
    expect(await detail("Full name")).toHaveTextContent("Demo Student");
    expect(await detail("Email address")).toHaveTextContent("student@leaderstutors.com");
    expect(await detail("Examination")).toHaveTextContent("Basic 5");
    expect(await detail("Department")).toHaveTextContent("Basic School");
    expect(await detail("Phone number")).toHaveTextContent("Not provided");
  });

  it("updates the password and clears the form", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Settings />);
    await fill(user, "old-secret1", "new-secret12", "new-secret12");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/password has been updated successfully/i);
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });

  it.each([
    ["too short", "old-secret1", "short", "short", /at least 8 characters/i],
    ["not matching", "old-secret1", "new-secret12", "new-secret13", /don't match/i],
    ["unchanged", "same-secret1", "same-secret1", "same-secret1", /different from your current password/i],
  ])("rejects a new password that is %s", async (_label, current, next, confirmation, message) => {
    const user = userEvent.setup();
    renderWithQuery(<Settings />);
    await fill(user, current, next, confirmation);
    await user.click(screen.getByRole("button", { name: /update password/i }));
    // HTML minLength validation is bypassed with the form's own checks.
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("shows the server's reason when the current password is wrong", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Settings />);
    await fill(user, MOCK_WRONG_PASSWORD, "new-secret12", "new-secret12");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your current password is incorrect.");
  });

  it("reveals and hides the typed passwords", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Settings />);
    await user.click(await screen.findByRole("button", { name: /show passwords/i }));
    expect(screen.getByLabelText("Current password")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /hide passwords/i }));
    expect(screen.getByLabelText("Current password")).toHaveAttribute("type", "password");
  });

  it("ends the session and returns to login", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Settings />);
    await user.click(await screen.findByRole("button", { name: /^sign out$/i }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(nav.replace).toHaveBeenCalledWith("/login");
  });
});
