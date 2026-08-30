import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_TOKEN_QUERY,
  attachAdminCookie,
  isValidAdminSecret,
} from "@/lib/admin/auth";

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (isValidAdminSecret(cookie)) {
    return NextResponse.next();
  }

  const token = request.nextUrl.searchParams.get(ADMIN_TOKEN_QUERY);
  if (isValidAdminSecret(token)) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(ADMIN_TOKEN_QUERY);
    const response = NextResponse.redirect(clean);
    attachAdminCookie(response);
    return response;
  }

  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/_not-found";
  notFoundUrl.search = "";
  return NextResponse.rewrite(notFoundUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
