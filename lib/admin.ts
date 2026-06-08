import { db } from "@/lib/db";

// Platform admin = User.role === "ADMIN". Checked against the DB (role isn't in
// the session token), so it can't be spoofed client-side.
export async function isAdmin(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === "ADMIN";
}

export const REPORT_TYPES = ["post", "user", "product", "store", "campaign", "comment"] as const;
export const REPORT_REASONS = ["spam", "scam", "abuse", "illegal", "other"] as const;
