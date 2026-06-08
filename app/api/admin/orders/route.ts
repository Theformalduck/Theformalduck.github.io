import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status = searchParams.get("status") ?? "";
  const take   = 30;
  const skip   = (page - 1) * take;

  const where: Record<string, any> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, userId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / take) });
}
