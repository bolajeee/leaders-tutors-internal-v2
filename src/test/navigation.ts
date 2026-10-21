import { vi } from "vitest";

/** Controllable stand-in for next/navigation, shared by every component test. */
export const nav = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/",
  search: "",
};

export const resetNavigation = () => {
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.back.mockReset();
  nav.pathname = "/";
  nav.search = "";
};

export const navigationModule = {
  useRouter: () => nav,
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
};
