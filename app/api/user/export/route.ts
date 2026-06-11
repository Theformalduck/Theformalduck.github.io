import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GDPR/CCPA data-access ("download my data") endpoint. Returns a JSON file with
// the signed-in user's personal data and the content they created.
//
// Deliberately EXCLUDED, because they are secrets or belong to other people:
//   • passwordHash, and the `accounts`/`sessions` relations (OAuth + session tokens)
//   • password-reset and email-verification tokens
//   • full product rows on the wishlist (those are other creators' products –
//     we only emit id/name/price so we never leak their digital file URLs etc.)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  try {
    const account = await db.user.findUnique({
      where: { id: userId },
      select: {
        // Profile
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        role: true,
        verified: true,
        stripeAccountId: true,
        paypalEmail: true,
        notificationPrefs: true,
        createdAt: true,
        updatedAt: true,

        // Content the user owns (safe, their own data)
        portfolio: true,
        store: true,
        products: true,
        collections: true,
        discounts: true,
        campaigns: { include: { rewards: true } },
        posts: true,
        comments: true,
        reviews: true,
        communityTemplates: true,

        // Commerce
        orders: { include: { items: true } }, // purchases the user made (items = scalars only)
        backedCampaigns: true, // crowdfunding pledges the user made
        subscriptions: true, // subscriptions the user pays for
        creatorSubscriptions: true, // subscriptions to the user's products
        subscribers: true, // newsletter emails the user collected

        // Social graph
        following: true,
        followers: true,
        notifications: true,

        // Team
        teamStaff: true,
        staffMemberships: true,

        // Limited, these reference products owned by other creators
        wishlist: { select: { id: true, name: true, price: true } },
      },
    });

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const body = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        notice:
          "This file contains the personal data Sellora holds for your account. " +
          "Secrets (passwords, tokens) are never included.",
        account,
      },
      null,
      2
    );

    const filename = `sellora-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[user/export]", err);
    return NextResponse.json({ error: "Failed to export your data. Please try again." }, { status: 500 });
  }
}
