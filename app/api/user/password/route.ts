import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[user/password POST]", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
