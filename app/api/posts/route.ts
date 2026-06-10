import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeArray } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const feed   = searchParams.get("feed"); // "following" | null
    const take   = 20;
    const userId = session.user.id;

    const followedIds = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedSet = new Set(followedIds.map((f) => f.followingId));

    const group = searchParams.get("group");
    let whereClause: Record<string, unknown>;
    if (group) {
      // Group feed — private groups are members-only.
      const g = await db.group.findUnique({ where: { id: group }, select: { visibility: true } });
      if (!g) return NextResponse.json({ posts: [], nextCursor: null });
      if (g.visibility === "PRIVATE") {
        const member = await db.groupMember.findUnique({
          where: { groupId_userId: { groupId: group, userId } },
          select: { status: true },
        });
        if (member?.status !== "ACTIVE") {
          return NextResponse.json({ error: "Not a member of this group", posts: [], nextCursor: null }, { status: 403 });
        }
      }
      whereClause = { groupId: group };
    } else if (feed === "following") {
      // Main feed only — group posts stay inside their groups.
      whereClause = { groupId: null, userId: { in: [...followedSet] } };
    } else {
      whereClause = { groupId: null };
    }

    const posts = await db.post.findMany({
      take,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, username: true, image: true, role: true } },
        _count: { select: { comments: true } },
        postLikes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const postsWithMeta = posts.map((p) => ({
      ...p,
      likedByMe: p.postLikes.length > 0,
      followedByMe: followedSet.has(p.userId),
      postLikes: undefined,
    }));

    const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
    return NextResponse.json({ posts: postsWithMeta, nextCursor });
  } catch (err) {
    captureError(err, { route: "/api/posts", method: "GET" });
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Throttle posting to curb spam/bots (10 posts/minute per user).
  const rl = await rateLimit(`post:${session.user.id}`, 10, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "You're posting too fast. Please wait a moment." }, { status: 429 });

  try {
    const body = await req.json();
    // Honeypot: bots fill hidden fields humans never see.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }
    const content = sanitizeField(body.content, 5000);
    const tags    = sanitizeArray(body.tags, false, 50);
    const images  = sanitizeArray(body.images, true);
    const groupId = typeof body.groupId === "string" && body.groupId ? body.groupId : null;

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    // Posting into a group requires active membership.
    if (groupId) {
      const member = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        select: { status: true },
      });
      if (member?.status !== "ACTIVE") {
        return NextResponse.json({ error: "You must be a member of this group to post." }, { status: 403 });
      }
    }

    const post = await db.post.create({
      data: {
        userId: session.user.id,
        content,
        tags,
        images,
        ...(groupId && { groupId }),
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true, role: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ ...post, likedByMe: false }, { status: 201 });
  } catch (err) {
    captureError(err, { route: "/api/posts", method: "POST" });
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
