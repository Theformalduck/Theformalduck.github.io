import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeUrl } from "@/lib/sanitize";

// List the groups the user belongs to, public groups to discover, and any
// pending join requests on groups the user owns.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [memberships, publicGroups, pending] = await Promise.all([
    db.groupMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: { group: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: "desc" },
    }),
    db.group.findMany({
      where: { visibility: "PUBLIC" },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.groupMember.findMany({
      where: { status: "PENDING", group: { ownerId: userId } },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        group: { select: { id: true, name: true } },
      },
    }),
  ]);

  const myGroupIds = new Set(memberships.map((m) => m.groupId));

  return NextResponse.json({
    myGroups: memberships.map((m) => ({
      id: m.group.id, name: m.group.name, slug: m.group.slug, image: m.group.image,
      visibility: m.group.visibility, members: m.group._count.members, role: m.role,
    })),
    discover: publicGroups
      .filter((g) => !myGroupIds.has(g.id))
      .map((g) => ({
        id: g.id, name: g.name, slug: g.slug, image: g.image, description: g.description,
        visibility: g.visibility, members: g._count.members,
      })),
    pending: pending.map((p) => ({ id: p.id, groupId: p.groupId, groupName: p.group.name, user: p.user })),
  });
}

// Create a group. The creator becomes the OWNER and an active member.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const name = sanitizeField(body.name, 80);
  if (!name) return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  const description = sanitizeField(body.description, 500) || null;
  const image = sanitizeUrl(body.image);
  const visibility = body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "group";
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const group = await db.group.create({
    data: {
      name, description, image: image ?? null, visibility, ownerId: userId, slug,
      members: { create: { userId, role: "OWNER", status: "ACTIVE" } },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json(
    { id: group.id, name: group.name, slug: group.slug, image: group.image, visibility: group.visibility, members: group._count.members, role: "OWNER" },
    { status: 201 }
  );
}
