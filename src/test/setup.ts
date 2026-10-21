import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("next/navigation", async () => (await import("./navigation")).navigationModule);

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  // Node-environment tests (e.g. the proxy) have no browser storage to reset.
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.cookie = "lt_session=; Path=/; Max-Age=0";
  }
});
