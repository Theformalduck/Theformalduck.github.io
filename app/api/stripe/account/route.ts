import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripeEnabled, createConnectAccount, createAccountLink, getAccountStatus, createLoginLink } from "@/lib/stripe";

// Seller payout status. "connected" means their Stripe account can take charges.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { stripeAccountId: true } });
  const accountId = user?.stripeAccountId ?? null;

  let chargesEnabled = false;
  let detailsSubmitted = false;
  if (accountId && stripeEnabled) {
    try {
      const status = await getAccountStatus(accountId);
      chargesEnabled = status.chargesEnabled;
      detailsSubmitted = status.detailsSubmitted;
    } catch (err) {
      console.error("[stripe/account GET status]", err);
    }
  }

  return NextResponse.json({
    connected: chargesEnabled,
    onboardingStarted: !!accountId,
    detailsSubmitted,
    accountId,
    stripeConfigured: stripeEnabled,
  });
}

// Start / continue Stripe onboarding, open the dashboard, or disconnect.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripeEnabled) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add STRIPE_SECRET_KEY to your environment variables." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "onboard");
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "";

  try {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { stripeAccountId: true, email: true } });

    if (action === "disconnect") {
      await db.user.update({ where: { id: session.user.id }, data: { stripeAccountId: null } });
      return NextResponse.json({ connected: false });
    }

    let accountId = user?.stripeAccountId ?? null;

    // Already onboarded → return a dashboard login link instead.
    if (action === "dashboard" && accountId) {
      const status = await getAccountStatus(accountId);
      if (status.detailsSubmitted) {
        const url = await createLoginLink(accountId);
        return NextResponse.json({ url });
      }
    }

    if (!accountId) {
      accountId = await createConnectAccount(user?.email);
      await db.user.update({ where: { id: session.user.id }, data: { stripeAccountId: accountId } });
    }

    const url = await createAccountLink(
      accountId,
      `${origin}/settings?stripe=refresh`,
      `${origin}/settings?stripe=connected`,
    );
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[stripe/account POST]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to start Stripe onboarding." }, { status: 500 });
  }
}
