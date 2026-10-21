import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./axios", () => ({ default: { post: vi.fn() } }));

import api from "./axios";
import { liveCall, readableMessage } from "./live-api";
import { ApiError } from "./errors";
import { useAuthStore } from "@/store/authStore";

const reply = (data: unknown) => vi.mocked(api.post).mockResolvedValue({ data });

describe("liveCall", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    useAuthStore.setState({ token: "stored-token", user: null, account: null, userEnrollment: null });
  });

  it("posts the fields form-encoded, dropping empty ones", async () => {
    reply({ success: true, message: "ok", response: 200, data: [1] });
    const result = await liveCall("/user/auth/login", { username: "a@b.co", password: "p w", skipped: undefined, blank: null, count: 3 });

    expect(result.data).toEqual([1]);
    const [path, body, config] = vi.mocked(api.post).mock.calls[0];
    expect(path).toBe("/user/auth/login");
    expect(body).toBeInstanceOf(URLSearchParams);
    expect((body as URLSearchParams).toString()).toBe("username=a%40b.co&password=p+w&count=3");
    expect(config?.headers).toMatchObject({ "Content-Type": "application/x-www-form-urlencoded" });
  });

  it("sends an explicit access key as the bearer token", async () => {
    reply({ success: true, message: "", response: 200 });
    await liveCall("/user/auth/signup-complete", {}, { token: "new-account-key" });
    expect(vi.mocked(api.post).mock.calls[0][2]?.headers).toMatchObject({ Authorization: "Bearer new-account-key" });
  });

  it("raises the API's own message when a 200 reply says success is false", async () => {
    reply({ success: false, message: "INVALID LOGIN! Check your username or password and try again", response: 100 });
    await expect(liveCall("/user/auth/login")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Invalid login. Check your username or password and try again.",
    });
  });

  it("ends the session when the access key is rejected", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { pathname: "/dashboard", search: "", assign });
    reply({ success: false, message: "SESSION EXPIRED! Login again", response: 50 });

    await expect(liveCall("/user/transactions/transaction-history")).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().token).toBeNull();
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/login?reason=session-expired"));
    vi.unstubAllGlobals();
  });

  it("does not sign the student out because a login attempt was refused", async () => {
    reply({ success: false, message: "WRONG PASSWORD! Try again", response: 50 });
    await expect(liveCall("/user/auth/login", { username: "a@b.co", password: "x" })).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBe("stored-token");
  });

  it("rejects a reply that is not JSON instead of guessing", async () => {
    reply("<html>PHP warning</html>");
    await expect(liveCall("/site/settings/fetch-settings")).rejects.toMatchObject({ status: 502 });
  });

  it("passes network failures through untouched", async () => {
    vi.mocked(api.post).mockRejectedValue({ status: 500, message: "Network Error" });
    await expect(liveCall("/site/settings/fetch-settings")).rejects.toMatchObject({ status: 500, message: "Network Error" });
  });
});

describe("readableMessage", () => {
  it("turns the API's shouted two-part message into sentences", () => {
    expect(readableMessage("USERNAME REQUIRED! Check username fields and try again")).toBe(
      "Username required. Check username fields and try again.",
    );
  });

  it("keeps ordinary messages and punctuation", () => {
    expect(readableMessage("Password reset code sent to your email.")).toBe("Password reset code sent to your email.");
    expect(readableMessage("Is that right?")).toBe("Is that right?");
  });

  it("falls back when there is nothing to show", () => {
    expect(readableMessage("")).toBe("Something went wrong. Please try again.");
    expect(readableMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
