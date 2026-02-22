import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isInviteRoute = pathname.startsWith("/invite");

  // Invite routes are publicly accessible (the page handles auth state)
  if (isInviteRoute) {
    return NextResponse.next();
  }

  // Protect app routes and onboarding
  if ((isAppRoute || isOnboarding) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages (unless they have an invite param)
  if (isAuthRoute && sessionCookie) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (invite) {
      return NextResponse.redirect(new URL(`/invite/${invite}`, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect users who already have a workspace away from onboarding
  if (isOnboarding && sessionCookie) {
    const workspaceCookie = request.cookies.get("ncts-workspace-id");
    if (workspaceCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Check via API if they already have a workspace
    try {
      const statusUrl = new URL("/api/onboarding/status", request.url);
      const res = await fetch(statusUrl.toString(), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.needsOnboarding && data.workspaceId) {
          const response = NextResponse.redirect(
            new URL("/dashboard", request.url),
          );
          response.cookies.set("ncts-workspace-id", data.workspaceId, {
            path: "/",
            httpOnly: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
          });
          return response;
        }
      }
    } catch {
      // If API fails, let them through to onboarding
    }
  }

  // For app routes, check if user needs onboarding
  // We do this by checking for a workspace cookie — if absent, check the API
  if (isAppRoute && sessionCookie) {
    const workspaceCookie = request.cookies.get("ncts-workspace-id");
    if (!workspaceCookie) {
      // Call the onboarding status API to check
      try {
        const statusUrl = new URL("/api/onboarding/status", request.url);
        const res = await fetch(statusUrl.toString(), {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.needsOnboarding) {
            return NextResponse.redirect(
              new URL("/onboarding", request.url)
            );
          }
          // Set the workspace cookie for future requests
          if (data.workspaceId) {
            const response = NextResponse.next();
            response.cookies.set("ncts-workspace-id", data.workspaceId, {
              path: "/",
              httpOnly: false,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 365, // 1 year
            });
            return response;
          }
        }
      } catch {
        // If the API call fails, let the request through
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/signup", "/invite/:path*"],
};
