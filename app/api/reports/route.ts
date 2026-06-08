import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { REPORT_TYPES, REPORT_REASONS } from "@/lib/admin";
import { sanitizeField } from "@/lib/sanitize";

// Submit a report (spam/scam/abuse/illegal) on a post, user, product, etc.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`report:${session.user.id}`, 20, 60 * 60 * 1000); // 20/hour
  if (!rl.allowed) return NextResponse.json({ error: "You're reporting too fast. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const targetType = String(body?.targetType ?? "");
  const targetId = String(body?.targetId ?? "");
  const reason = String(body?.reason ?? "");
  const details = body?.details ? sanitizeField(body.details, 1000) || null : null;

  if (!REPORT_TYPES.includes(targetType as any)) return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  if (!REPORT_REASONS.includes(reason as any)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  if (!targetId) return NextResponse.json({ error: "Missing target" }, { status: 400 });

  // Avoid duplicate open reports from the same user on the same target.
  const existing = await db.report.findFirst({
    where: { reporterId: session.user.id, targetType, targetId, status: "open" },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, already: true });

  await db.report.create({
    data: { reporterId: session.user.id, targetType, targetId, reason, details },
  });
  return NextResponse.json({ ok: true });
}
