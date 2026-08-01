import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate only (cookie presence).
 * Real authorization always happens in Server Components / Server Actions.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/encounters") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/video") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ai");

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    // Drop demo/prefill query (email, password) — never carry onto the app shell
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/doctors/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/prescriptions/:path*",
    "/encounters/:path*",
    "/billing/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/video/:path*",
    "/admin/:path*",
    "/ai/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
