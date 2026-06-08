import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getIP(req);
  const rl = await rateLimit(`search:${ip}`, 60, 60 * 1000); // 60 per minute per IP
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [], products: [], campaigns: [], posts: [] });

  const [users, products, campaigns, posts] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: session.user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, username: true, image: true, role: true },
      take: 5,
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
        userId: session.user.id,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, price: true, type: true, images: true },
      take: 5,
    }),
    db.campaign.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDesc: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, raised: true, goal: true, status: true },
      take: 5,
    }),
    db.post.findMany({
      where: { content: { contains: q, mode: "insensitive" } },
      include: { user: { select: { name: true, username: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ users, products, campaigns, posts });
}
