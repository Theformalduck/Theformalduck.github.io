// ── Stripe client + Connect helpers ─────────────────────────────────────────────
// Sellers connect their own Stripe via Connect (Express onboarding). Checkout
// uses destination charges: the charge is created on the platform and the funds
// are transferred to the seller's connected account, with the platform taking an
// application fee (STRIPE_PLATFORM_FEE_PERCENT). When STRIPE_SECRET_KEY is unset,
// `stripeEnabled` is false and callers return a clean "not configured" error.

import Stripe from "stripe";

const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = !!SECRET_KEY;

// Platform fee Sellora takes on every sale, charged as a Stripe application fee
// on the destination charge, so it applies to both store checkout and campaign
// pledges automatically. Override per environment with STRIPE_PLATFORM_FEE_PERCENT
// (e.g. "0" to disable, "10" for 10%).
export const DEFAULT_PLATFORM_FEE_PERCENT = 7.5;
export const platformFeePercent = (() => {
  const raw = process.env.STRIPE_PLATFORM_FEE_PERCENT;
  const n = raw !== undefined ? parseFloat(raw) : DEFAULT_PLATFORM_FEE_PERCENT;
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : DEFAULT_PLATFORM_FEE_PERCENT;
})();

// Back-compat: some modules import { stripe }. Null when not configured.
export const stripe = SECRET_KEY ? new Stripe(SECRET_KEY) : null;

export function stripeClient(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
}

const toCents = (n: number) => Math.round(n * 100);

// ── Connect onboarding ──────────────────────────────────────────────────────────

// Create a new Express connected account for a seller. Returns the account id.
export async function createConnectAccount(email?: string | null): Promise<string> {
  const account = await stripeClient().accounts.create({
    type: "express",
    ...(email ? { email } : {}),
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  });
  return account.id;
}

// Build a hosted onboarding link the seller is redirected to.
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
  const link = await stripeClient().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

// Read a connected account's readiness. `chargesEnabled` means it can take money.
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const a = await stripeClient().accounts.retrieve(accountId);
  return {
    chargesEnabled: !!a.charges_enabled,
    payoutsEnabled: !!a.payouts_enabled,
    detailsSubmitted: !!a.details_submitted,
  };
}

// A login link to the seller's Express dashboard (only valid once onboarded).
export async function createLoginLink(accountId: string): Promise<string> {
  const link = await stripeClient().accounts.createLoginLink(accountId);
  return link.url;
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export interface StripeLineItem { name: string; quantity: number; unitPrice: number }

export interface CreateCheckoutParams {
  sellerAccountId: string;     // destination connected account
  currency: string;
  items: StripeLineItem[];
  total: number;               // final charge after discount
  customId?: string;
  description?: string;
  successUrl: string;          // may contain {CHECKOUT_SESSION_ID}
  cancelUrl: string;
  brandName?: string;
  buyerEmail?: string | null;
}

// Create a hosted Checkout Session (destination charge → seller, app fee → platform).
export async function createCheckoutSession(p: CreateCheckoutParams): Promise<{ id: string; url: string | null }> {
  const cur = p.currency.toLowerCase();
  const itemTotal = p.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Distribute any discount across the line items by scaling unit prices so the
  // session total matches `p.total` exactly (Stripe has no order-level discount).
  const scale = itemTotal > 0 ? p.total / itemTotal : 1;
  const line_items = p.items.map((i) => ({
    quantity: i.quantity,
    price_data: {
      currency: cur,
      unit_amount: Math.max(0, toCents(i.unitPrice * scale)),
      product_data: { name: i.name.slice(0, 250) },
    },
  }));

  const feeAmount = platformFeePercent > 0 ? toCents(p.total * (platformFeePercent / 100)) : 0;

  const session = await stripeClient().checkout.sessions.create({
    mode: "payment",
    line_items,
    payment_intent_data: {
      ...(feeAmount > 0 ? { application_fee_amount: feeAmount } : {}),
      transfer_data: { destination: p.sellerAccountId },
      ...(p.description ? { description: p.description.slice(0, 250) } : {}),
    },
    ...(p.buyerEmail ? { customer_email: p.buyerEmail } : {}),
    ...(p.customId ? { client_reference_id: p.customId.slice(0, 200) } : {}),
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  });

  return { id: session.id, url: session.url };
}

// Read a session after the buyer returns. `paid` means the payment completed.
export async function retrieveSession(sessionId: string): Promise<{
  paid: boolean;
  paymentIntentId: string | null;
  buyerEmail: string | null;
  amount: number;
  currency: string;
}> {
  const s = await stripeClient().checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
  const pi = s.payment_intent;
  const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;
  return {
    paid: s.payment_status === "paid",
    paymentIntentId,
    buyerEmail: s.customer_details?.email ?? s.customer_email ?? null,
    amount: (s.amount_total ?? 0) / 100,
    currency: (s.currency ?? "usd").toUpperCase(),
  };
}

// Refund a payment and reverse the seller transfer + application fee.
export async function refundPayment(paymentIntentId: string): Promise<void> {
  await stripeClient().refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}
