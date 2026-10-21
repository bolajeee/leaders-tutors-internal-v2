import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore, daysUntil } from "@/services/mock/demoStore";
import { nav } from "@/test/navigation";
import { renderWithQuery, resetAppState } from "@/test/utils";
import { MOCK_OTP, MOCK_WRONG_PASSWORD } from "@/services/mock/directory";

const fillLogin = async (user: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  await user.type(await screen.findByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
};

describe("login", () => {
  beforeEach(resetAppState);

  it("signs in on Enter and opens the dashboard", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await fillLogin(user, "ada@example.com", "secret12{Enter}");

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    expect(useAuthStore.getState()).toMatchObject({ token: expect.stringMatching(/^mock-session-/) });
    expect(useAuthStore.getState().user).toMatchObject({ email: "ada@example.com", first_name: "Ada" });
    expect(useAuthStore.getState().userEnrollment).toMatchObject({ examAbbreviation: "Basic 5" });
  });

  it("returns to the page the student was heading for", async () => {
    nav.search = "next=%2Ftutorials%3Fsubject%3Dmathematics";
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await fillLogin(user, "ada@example.com", "secret12{Enter}");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tutorials?subject=mathematics"));
  });

  it("ignores a return path that leaves the site", async () => {
    nav.search = "next=https%3A%2F%2Fevil.example";
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await fillLogin(user, "ada@example.com", "secret12{Enter}");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a clear error for bad credentials and stays signed out", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await fillLogin(user, "ada@example.com", `${MOCK_WRONG_PASSWORD}{Enter}`);
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(useAuthStore.getState().token).toBeNull();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("validates the form before signing in", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await fillLogin(user, "not-an-email", "123{Enter}");
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 6 characters long")).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("explains an expired session", async () => {
    nav.search = "reason=session-expired";
    renderWithQuery(<Login />);
    expect(await screen.findByRole("status")).toHaveTextContent(/your session has expired/i);
  });

  it("sends an already signed-in student to the portal", async () => {
    useAuthStore.setState({ token: "t" });
    renderWithQuery(<Login />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("offers one-click demo accounts in mock mode, including an expired plan", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await user.click(await screen.findByRole("button", { name: /demo with expired plan/i }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    expect(daysUntil(useDemoStore.getState().subscriptionEndsAt)).toBe(0);
  });

  it("hides the demo accounts when the app talks to the real API", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    renderWithQuery(<Login />);
    await screen.findByLabelText(/email address/i);
    expect(screen.queryByText(/local demo/i)).not.toBeInTheDocument();
  });

  it("toggles password visibility with an accessible control", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    const password = await screen.findByLabelText(/^password$/i);
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("password recovery", () => {
  beforeEach(resetAppState);

  const startRecovery = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole("button", { name: /reset password here/i }));
    await user.type(await screen.findByLabelText(/email address/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /proceed/i }));
  };

  const enterCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
    const group = await screen.findByRole("group", { name: /verification code/i });
    await user.click(within(group).getByLabelText("Digit 1 of 6"));
    await user.paste(code);
    await user.click(screen.getByRole("button", { name: /proceed/i }));
  };

  it("walks email → code → new password → confirmation", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await startRecovery(user);
    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText(`Demo code: ${MOCK_OTP}`)).toBeInTheDocument();
    await enterCode(user, MOCK_OTP);

    await user.type(await screen.findByLabelText(/^create password$/i), "newpassword1");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword1");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    const done = await screen.findByRole("dialog", { name: /password reset successful/i });
    await user.click(within(done).getByRole("button", { name: /login to my account/i }));
    expect(await screen.findByRole("heading", { name: /welcome/i })).toBeInTheDocument();
  });

  it("rejects a short or mismatched password without calling the API", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await startRecovery(user);
    await enterCode(user, MOCK_OTP);

    await user.type(await screen.findByLabelText(/^create password$/i), "short");
    await user.type(screen.getByLabelText(/^confirm password$/i), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/i);

    await user.clear(screen.getByLabelText(/^create password$/i));
    await user.clear(screen.getByLabelText(/^confirm password$/i));
    await user.type(screen.getByLabelText(/^create password$/i), "longenough1");
    await user.type(screen.getByLabelText(/^confirm password$/i), "different12");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/don't match/i);
  });

  it("lets the student re-enter a wrong code", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await startRecovery(user);
    await enterCode(user, "111111");
    await user.type(await screen.findByLabelText(/^create password$/i), "newpassword1");
    await user.type(screen.getByLabelText(/^confirm password$/i), "newpassword1");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/code isn't correct/i);
    await user.click(within(alert).getByRole("button", { name: /re-enter the code/i }));
    expect(await screen.findByRole("group", { name: /verification code/i })).toBeInTheDocument();
  });

  it("asks for a valid email first", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await user.click(await screen.findByRole("button", { name: /reset password here/i }));
    await user.type(await screen.findByLabelText(/email address/i), "nope");
    await user.click(screen.getByRole("button", { name: /proceed/i }));
    expect(await screen.findByText(/enter the email address you registered with/i)).toBeInTheDocument();
  });

  it("is honest that recovery is unavailable until the API supports it", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.stubEnv("NEXT_PUBLIC_PASSWORD_RECOVERY_PATH", "");
    const user = userEvent.setup();
    renderWithQuery(<Login />);
    await user.click(await screen.findByRole("button", { name: /reset password here/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/online password recovery is not enabled/i);
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to login/i }));
    expect(await screen.findByRole("heading", { name: /welcome/i })).toBeInTheDocument();
  });
});
