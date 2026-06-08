import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    return NextResponse.json({ following: false });
  }

  await Promise.all([
    db.follow.create({ data: { followerId: session.user.id, followingId: targetUserId } }),
    db.notification.create({
      data: {
        userId: targetUserId,
        type: "NEW_FOLLOWER",
        title: "You have a new follower!",
        body: `Someone started following you.`,
        data: { followerId: session.user.id },
      },
    }),
  ]);

  return NextResponse.json({ following: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("targetUserId");

  if (targetUserId) {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
    return NextResponse.json({ following: !!follow });
  }

  const [suggestions, followingRows] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: session.user.id },
        following: { none: { followerId: session.user.id } },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        role: true,
        _count: { select: { following: true } },
      },
      take: 5,
      orderBy: { following: { _count: "desc" } },
    }),
    db.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    }),
  ]);

  return NextResponse.json({
    suggestions,
    following: followingRows.map((f) => f.followingId),
  });
}
