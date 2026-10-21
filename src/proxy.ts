import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, loginUrl } from "@/lib/routes";

/**
 * Routes signed-out visitors away from the student portal before it renders.
 * It only checks the marker cookie; token validity is enforced by the API and
 * the client-side session guard in `PortalWrapper`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();
  if (request.cookies.get("lt_session")?.value) return NextResponse.next();

  const target = request.nextUrl.clone();
  const [path, query] = loginUrl({ next: `${pathname}${search}` }).split("?");
  target.pathname = path;
  target.search = query ? `?${query}` : "";
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tutorials/:path*",
    "/transactions/:path*",
    "/subscriptions/:path*",
    "/settings/:path*",
  ],
};
