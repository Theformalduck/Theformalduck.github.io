import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeUrl } from "@/lib/sanitize";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const username = body.username !== undefined ? sanitizeField(body.username, 30) : undefined;
    const bio      = body.bio !== undefined ? (sanitizeField(body.bio, 500) || null) : undefined;
    const name     = body.name !== undefined ? sanitizeField(body.name, 100) : undefined;
    const image    = body.image !== undefined ? sanitizeUrl(body.image) : undefined;

    // Notification preferences — a fixed set of boolean toggles.
    let notificationPrefs: Record<string, boolean> | undefined;
    if (body.notificationPrefs && typeof body.notificationPrefs === "object") {
      const allowed = ["newBackers", "milestones", "newOrders", "newFollowers", "comments", "platformUpdates"];
      notificationPrefs = {};
      for (const k of allowed) notificationPrefs[k] = !!body.notificationPrefs[k];
    }

    if (username) {
      const taken = await db.user.findUnique({ where: { username } });
      if (taken && taken.id !== session.user.id) {
        return NextResponse.json(
          { error: "That username is already taken." },
          { status: 409 }
        );
      }
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(username !== undefined && { username: username || null }),
        ...(bio !== undefined && { bio }),
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image: image ?? null }),
        ...(notificationPrefs !== undefined && { notificationPrefs }),
      },
      select: { id: true, username: true, bio: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[profile PATCH]", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      bio: true,
      image: true,
      role: true,
      verified: true,
      createdAt: true,
      notificationPrefs: true,
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });

  return NextResponse.json(user);
}
