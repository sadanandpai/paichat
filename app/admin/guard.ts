import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, isValidAdminSecret } from "@/lib/admin/auth";

export async function requireAdmin(): Promise<void> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!isValidAdminSecret(value)) {
    notFound();
  }
}
