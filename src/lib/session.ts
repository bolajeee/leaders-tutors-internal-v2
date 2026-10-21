import { useAuthStore } from "@/store/authStore";
import { isProtectedPath, loginUrl } from "@/lib/routes";

/** Requests to these paths report bad credentials with 401, not an expired session. */
const isAuthRequest = (url?: string) => Boolean(url && url.includes("/user/auth/"));

/**
 * Called by the HTTP client when the API answers 401 for a signed-in student.
 * Clears the session and sends them to login with an explanatory message.
 */
export const handleUnauthorized = (requestUrl?: string) => {
  if (isAuthRequest(requestUrl)) return;
  const { token, clearAuth } = useAuthStore.getState();
  if (!token) return;
  clearAuth();
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.location.assign(
    loginUrl({
      reason: "session-expired",
      next: isProtectedPath(pathname) ? `${pathname}${search}` : undefined,
    }),
  );
};
