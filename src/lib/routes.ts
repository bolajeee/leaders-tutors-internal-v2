export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tutorials",
  "/transactions",
  "/subscriptions",
  "/settings",
] as const;

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const loginUrl = (options?: { next?: string; reason?: "session-expired" }) => {
  const params = new URLSearchParams();
  if (options?.reason) params.set("reason", options.reason);
  if (options?.next) params.set("next", options.next);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
};
