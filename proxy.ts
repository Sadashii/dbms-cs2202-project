import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAME = "banking_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Public routes that require no auth
  const publicPaths = ["/login", "/verify"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "?"))) {
    return NextResponse.next();
  }

  // Root redirect is handled by app/page.tsx
  if (pathname === "/") {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Customer routes
  if (pathname.startsWith("/dashboard")) {
    if (payload.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Employee / admin routes
  if (pathname.startsWith("/admin")) {
    if (payload.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/verify"],
};
