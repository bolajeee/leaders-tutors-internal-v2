// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { isProtectedPath, loginUrl } from "@/lib/routes";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

describe("route protection", () => {
  it.each(["/dashboard", "/tutorials", "/tutorials/living-things", "/transactions", "/subscriptions", "/settings"])(
    "sends a signed-out visitor from %s to login with a return path",
    (path) => {
      const response = proxy(request(path));
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location") as string);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    },
  );

  it("preserves the query string in the return path", () => {
    const response = proxy(request("/tutorials?subject=mathematics"));
    const location = new URL(response.headers.get("location") as string);
    expect(location.searchParams.get("next")).toBe("/tutorials?subject=mathematics");
  });

  it("lets a visitor with a session marker through", () => {
    const response = proxy(request("/dashboard", "lt_session=1"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("leaves public pages alone", () => {
    for (const path of ["/", "/login", "/sign-up", "/sign-up/verify-account"]) {
      expect(proxy(request(path)).headers.get("x-middleware-next")).toBe("1");
    }
  });

  it("recognises protected paths by prefix, not substring", () => {
    expect(isProtectedPath("/dashboard/anything")).toBe(true);
    expect(isProtectedPath("/dashboards")).toBe(false);
    expect(isProtectedPath("/tutorialsfoo")).toBe(false);
  });

  it("builds login URLs with an optional reason and next path", () => {
    expect(loginUrl()).toBe("/login");
    expect(loginUrl({ reason: "session-expired", next: "/settings" })).toBe(
      "/login?reason=session-expired&next=%2Fsettings",
    );
  });
});
