import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail, feedbackEmail } from "@/lib/email";

// Where dashboard feedback is delivered.
const FEEDBACK_TO = "austinlee.spencer2@gmail.com";

const CATEGORIES = ["Idea", "Bug", "Question", "Other"];

export async function POST(req: NextRequest) {
  // Require a signed-in user, keeps the inbox free of anonymous spam and lets
  // us attribute / reply to the sender.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to send feedback." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim();
    const rawCategory = String(body?.category ?? "Other");
    const category = CATEGORIES.includes(rawCategory) ? rawCategory : "Other";

    if (!message) {
      return NextResponse.json({ error: "Please enter your feedback." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Feedback is too long (max 5000 characters)." }, { status: 400 });
    }

    const userEmail = session.user.email ?? "unknown";
    const userName = session.user.name ?? "";

    await sendEmail({
      to: FEEDBACK_TO,
      subject: `Sellora feedback · ${category} · ${userName || userEmail}`,
      html: feedbackEmail({ message, category, userEmail, userName }),
      // Let the recipient reply straight back to whoever sent it.
      replyTo: userEmail !== "unknown" ? userEmail : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] error", err);
    return NextResponse.json({ error: "Couldn't send your feedback. Please try again." }, { status: 500 });
  }
}
