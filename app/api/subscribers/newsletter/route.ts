import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, newsletterEmail, appUrl } from "@/lib/email";
import { makeUnsubToken } from "@/lib/unsubscribe";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { stripTags } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 2000;

// Store owner sends a newsletter to their subscribers plus any extra addresses.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // Throttle blasts to curb abuse (3 sends / 10 minutes).
  const rl = await rateLimit(`newsletter:${userId}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "You're sending newsletters too fast, please wait a few minutes." }, { status: 429 });
  }

  try {
    const raw = await req.json().catch(() => ({}));
    const subject = String(raw.subject ?? "").trim().slice(0, 200);
    const messageHtml = sanitizeRichHtml(String(raw.body ?? ""), 20_000);
    if (!subject || stripTags(messageHtml).trim().length === 0) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    // Parse extra emails (textarea: comma / newline / space separated).
    const extraRaw = Array.isArray(raw.extraEmails)
      ? raw.extraEmails
      : String(raw.extraEmails ?? "").split(/[\s,;]+/);
    const extraEmails = extraRaw.map((e: string) => String(e).trim().toLowerCase()).filter((e: string) => EMAIL_RE.test(e));

    const [subs, owner] = await Promise.all([
      db.subscriber.findMany({ where: { ownerId: userId }, select: { email: true } }),
      db.user.findUnique({ where: { id: userId }, select: { email: true, username: true, store: { select: { name: true } } } }),
    ]);

    const recipients = Array.from(new Set([...subs.map((s) => s.email), ...extraEmails])).slice(0, MAX_RECIPIENTS);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients, you have no subscribers yet. Add some emails to send to." }, { status: 400 });
    }

    const storeName = owner?.store?.name ?? owner?.username ?? "the store";
    const storeUsername = owner?.username ?? "";
    const replyTo = owner?.email ?? undefined;

    // Send in the background with limited concurrency so the request returns
    // immediately and a large list never times out the function. Each email gets
    // its own signed unsubscribe link.
    after(async () => {
      let idx = 0;
      const worker = async () => {
        while (idx < recipients.length) {
          const to = recipients[idx++];
          try {
            const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${makeUnsubToken(userId, to)}`;
            const html = newsletterEmail({ subject, body: messageHtml, storeName, storeUsername, unsubscribeUrl });
            await sendEmail({ to, subject, html, replyTo });
          } catch (e) {
            captureError(e, { route: "/api/subscribers/newsletter", to, userId });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(10, recipients.length) }, worker));
    });

    return NextResponse.json({ queued: recipients.length, subscribers: subs.length, extra: extraEmails.length });
  } catch (err) {
    captureError(err, { route: "/api/subscribers/newsletter", userId });
    return NextResponse.json({ error: "Failed to send newsletter." }, { status: 500 });
  }
}
