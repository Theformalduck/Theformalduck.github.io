import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmailAfter, verifyEmailTemplate, appUrl } from "@/lib/email";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { sanitizeField } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const rl = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 per hour per IP
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    // Honeypot: a hidden field humans leave empty. Silently accept (don't create)
    // so bots think they succeeded.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }
    const name = sanitizeField(body.name, 100);
    const email = (body.email as string)?.trim().toLowerCase();
    const { password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const roleMap: Record<string, string> = {
      creator: "CREATOR",
      developer: "CREATOR",
      entrepreneur: "CREATOR",
      educator: "CREATOR",
    };

    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role: (roleMap[role] ?? "CREATOR") as any,
      },
    });

    // Send verification email (fire-and-forget; don't block registration)
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.emailVerificationToken.create({ data: { userId: user.id, token, expiresAt } });
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
      sendEmailAfter({
        to: email,
        subject: "Verify your Sellora email",
        html: verifyEmailTemplate(verifyUrl),
      });
    } catch (e) {
      console.error("[register] failed to send verification email:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[register]", err);
    const isDatabaseError =
      err?.message?.includes("ECONNREFUSED") ||
      err?.message?.includes("connect") ||
      err?.code === "P1001" ||
      err?.code === "P1017";
    return NextResponse.json(
      {
        error: isDatabaseError
          ? "Database not connected. Add your DATABASE_URL to .env.local and run prisma migrate dev."
          : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
