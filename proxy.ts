import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PATHS = [
  "/dashboard",
  "/portfolio",
  "/campaigns",
  "/store",
  "/community",
  "/analytics",
  "/subscriptions",
  "/orders",
  "/settings",
  "/ai-tools",
  "/help",
];

const AUTH_PATHS = ["/login", "/signup"];

// Stripe webhooks have their own signature verification — exempt from CSRF.
const CSRF_EXEMPT = ["/api/webhooks/"];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const { pathname, origin: reqOrigin } = req.nextUrl;
  const method = req.method;

  // ── CSRF: reject cross-origin state-changing API calls ───────────────────
  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(method)) {
    const exempt = CSRF_EXEMPT.some(p => pathname.startsWith(p));
    if (!exempt) {
      const originHeader = req.headers.get("origin");
      const appUrl =
        process.env.NEXTAUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        reqOrigin;

      // If an Origin header is present and doesn't match the app, reject.
      // Absent Origin (same-site form posts, curl) is allowed.
      if (originHeader && !originHeader.startsWith(appUrl)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  // ── Session cookie presence check ────────────────────────────────────────
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");
  const isLoggedIn = !!sessionCookie;

  // ── Admin routes: must be logged in (role verified in the layout) ─────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Dashboard routes ──────────────────────────────────────────────────────
  const isDashboard = DASHBOARD_PATHS.some(
    p => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  if (!isLoggedIn && isDashboard) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg).*)",
  ],
};
