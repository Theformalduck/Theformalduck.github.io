import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured on this server." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "";

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    });

    let accountId = user?.stripeAccountId ?? null;

    // Make sure any existing account is still usable before trying to link it.
    // A rejected account (Stripe disabled_reason "rejected.*") can never be
    // onboarded again, and one created in a different Stripe mode won't resolve.
    // In either case, discard it so the user starts fresh instead of being stuck.
    if (accountId) {
      let usable = true;
      try {
        const acct = await stripe.accounts.retrieve(accountId);
        if ((acct.requirements?.disabled_reason ?? "").startsWith("rejected")) usable = false;
      } catch {
        usable = false; // account doesn't exist / belongs to another mode
      }
      if (!usable) {
        accountId = null;
        await db.user.update({ where: { id: session.user.id }, data: { stripeAccountId: null } });
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: accountId },
      });
    }

    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/settings?tab=payments`,
        return_url: `${origin}/settings?tab=payments&stripe=connected`,
        type: "account_onboarding",
      });
      return NextResponse.json({ url: accountLink.url });
    } catch (linkErr: any) {
      // Last-resort recovery: the saved account still can't be linked (rejected,
      // wrong Stripe mode, or otherwise invalid). Wipe it and try exactly once
      // with a brand-new account so the user is never permanently blocked.
      const msg = String(linkErr?.message ?? "").toLowerCase();
      const unrecoverable =
        linkErr?.code === "account_invalid" ||
        msg.includes("rejected") ||
        msg.includes("live mode") || msg.includes("test mode") ||
        msg.includes("does not have access");
      if (unrecoverable) {
        await db.user.update({ where: { id: session.user.id }, data: { stripeAccountId: null } });
        const account = await stripe.accounts.create({ type: "express" });
        await db.user.update({ where: { id: session.user.id }, data: { stripeAccountId: account.id } });
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${origin}/settings?tab=payments`,
          return_url: `${origin}/settings?tab=payments&stripe=connected`,
          type: "account_onboarding",
        });
        return NextResponse.json({ url: accountLink.url });
      }
      throw linkErr;
    }
  } catch (err: any) {
    console.error("[stripe/connect POST]", err);
    const raw = String(err?.message ?? "");
    // The platform's OWN Stripe account is rejected, under it no connected
    // account can be created or linked, so recovery is impossible here. This is
    // a Stripe account-status problem, not a user error: explain it actionably.
    if (raw.toLowerCase().includes("your account has been rejected")) {
      return NextResponse.json({
        error: "Payments can't be set up because this platform's Stripe account has been rejected by Stripe. Connect an active Stripe account (update STRIPE_SECRET_KEY) or resolve the rejection from the Stripe dashboard.",
      }, { status: 502 });
    }
    return NextResponse.json({ error: raw || "Failed to create Stripe Connect link." }, { status: 500 });
  }
}

export async function GET() {
  if (!stripe) {
    return NextResponse.json({ connected: false, stripeConfigured: false });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ connected: false, stripeConfigured: true });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    return NextResponse.json({
      connected: true,
      stripeConfigured: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirementsDue: account.requirements?.currently_due ?? [],
      dashboardUrl: null,
    });
  } catch (err) {
    console.error("[stripe/connect GET]", err);
    return NextResponse.json({ connected: false, stripeConfigured: true });
  }
}
