import { db } from "./db";
import { sendEmailAfter, activityEmail } from "./email";

// Maps each notification `type` to the per-category preference key that gates
// its email. The master switch is `emailNotifications`; if a type isn't listed
// here it still emails (when the master switch is on) and isn't category-gated.
const EMAIL_PREF_KEY: Record<string, string> = {
  ORDER_MESSAGE: "newOrders",
  NEW_ORDER: "newOrders",
  NEW_BACKER: "newBackers",
  MILESTONE: "milestones",
  NEW_FOLLOWER: "newFollowers",
  POST_COMMENT: "comments",
  CAMPAIGN_COMMENT: "comments",
  REVIEW_REPLY: "comments",
};

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown>;
  /** Path the email's button links to (defaults to /dashboard). */
  link?: string;
  /** Set false to create the in-app notification but never email it. */
  email?: boolean;
}

/**
 * Create an in-app notification and, when the recipient has opted in, also send
 * them an email. Use this instead of `db.notification.create` so every alert
 * can reach users who are away from the app. Safe to await in request handlers;
 * the email itself is sent after the response via `sendEmailAfter`.
 */
export async function notify(input: NotifyInput) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      ...(input.data ? { data: input.data as object } : {}),
    },
  });

  if (input.email === false) return notification;

  try {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, notificationPrefs: true },
    });
    if (!user?.email) return notification;

    const prefs = (user.notificationPrefs as Record<string, boolean> | null) ?? {};
    // Master opt-in must be on.
    if (!prefs.emailNotifications) return notification;
    // If this type maps to a category the user muted, skip the email.
    const catKey = EMAIL_PREF_KEY[input.type];
    if (catKey && prefs[catKey] === false) return notification;

    sendEmailAfter({
      to: user.email,
      subject: input.title,
      html: activityEmail({ title: input.title, body: input.body ?? undefined, link: input.link }),
    });
  } catch (e) {
    console.error("[notify] email step failed:", e);
  }

  return notification;
}
