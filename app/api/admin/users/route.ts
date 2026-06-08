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
  const q      = searchParams.get("q")?.trim() ?? "";
  const filter = searchParams.get("filter") ?? "all"; // all | banned | admin
  const take   = 30;
  const skip   = (page - 1) * take;

  const where: Record<string, any> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter === "banned") where.bannedAt = { not: null };
  if (filter === "admin") where.role = "ADMIN";

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        verified: true,
        bannedAt: true,
        createdAt: true,
        _count: { select: { orders: true, products: true, campaigns: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / take) });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action, role } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  const validRoles = ["CREATOR", "SUPPORTER", "BUYER", "INVESTOR", "RECRUITER", "ADMIN"];

  if (action === "ban") {
    await db.user.update({ where: { id: userId }, data: { bannedAt: new Date() } });
  } else if (action === "unban") {
    await db.user.update({ where: { id: userId }, data: { bannedAt: null } });
  } else if (action === "setRole" && role && validRoles.includes(role)) {
    await db.user.update({ where: { id: userId }, data: { role } });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
