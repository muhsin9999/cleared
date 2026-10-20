// Optimistic gate only: sends visitors without a session cookie to the landing page.
// The real check is requireSeller() in every page, action and route handler.
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = ["/home", "/sales", "/cases", "/notices", "/activity", "/settings", "/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (APP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`)) && !request.cookies.has("cleared_session")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"] };
