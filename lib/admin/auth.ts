import { timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const ADMIN_TOKEN_QUERY = "token";
export const ADMIN_COOKIE = "admin";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getAdminSecret(): string | undefined {
  const secret = process.env.ADMIN_SECRET;
  return secret ? secret : undefined;
}

export function isValidAdminSecret(
  value: string | undefined | null,
): boolean {
  const secret = getAdminSecret();
  if (!secret || !value) return false;

  const expected = Buffer.from(secret);
  const given = Buffer.from(value);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function attachAdminCookie(response: NextResponse): void {
  const secret = getAdminSecret();
  if (!secret) return;

  response.cookies.set({
    name: ADMIN_COOKIE,
    value: secret,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: COOKIE_MAX_AGE,
  });
}
