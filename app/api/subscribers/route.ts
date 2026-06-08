import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: a shopper subscribes to a store's newsletter.
export async function POST(req: NextRequest) {
  try {
    const { creatorUsername, email } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase().slice(0, 200);
    if (!EMAIL_RE.test(clean)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    if (!creatorUsername) return NextResponse.json({ error: "Unknown store" }, { status: 400 });

    const owner = await db.user.findUnique({ where: { username: String(creatorUsername) }, select: { id: true } });
    if (!owner) return NextResponse.json({ error: "Unknown store" }, { status: 404 });

    await db.subscriber.upsert({
      where: { ownerId_email: { ownerId: owner.id, email: clean } },
      create: { ownerId: owner.id, email: clean },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }
}

// Owner: list their subscribers, or export as CSV with ?format=csv.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await db.subscriber.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (new URL(req.url).searchParams.get("format") === "csv") {
    const rows = ["email,subscribed_at", ...subs.map(s => `${s.email},${s.createdAt.toISOString()}`)];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers.csv"`,
      },
    });
  }

  return NextResponse.json(subs);
}
