# Sellora — Pre-Launch Checklist

_Last reviewed: 2026-06-08. "Live Stripe keys" ≠ "complete" — this is what
actually has to hold for a real stranger to sign up, pay, get fulfilled, and a
creator to get paid._

Legend: 🔴 blocker · 🟠 important · 🟡 verify

---

## Payments & fulfillment

- [x] 🔴 **Webhook fulfills orders when the buyer doesn't return.** _(Fixed.)_
  Previously the webhook read `session.metadata` that `createCheckoutSession`
  never set, so it was a no-op; fulfillment depended entirely on the buyer
  landing back on the success page. The webhook now uses the same idempotent
  `pendingCheckout` + `fulfill.ts` path as `/api/orders/confirm`.
- [ ] 🔴 **Register the live webhook endpoint in the Stripe dashboard** pointing
  at `https://<prod-domain>/api/webhooks/stripe`, subscribed to at least
  `checkout.session.completed`, `customer.subscription.updated`/`.deleted`,
  `invoice.payment_succeeded`/`.payment_failed`. Put its **live**-mode signing
  secret in `STRIPE_WEBHOOK_SECRET` (test and live secrets differ).
- [ ] 🔴 **Test a real purchase in live mode end-to-end**, then **mid-flow abandon
  one** (pay, close the tab before redirect) and confirm the webhook still
  creates the order + sends the confirmation email. Then **refund** it
  (`/api/orders/[id]/refund`) and confirm the transfer reverses.
- [ ] 🔴 **Creator payouts (Stripe Connect) work in live mode.** Onboard a real
  connected account, confirm `charges_enabled` + `payouts_enabled`, and that a
  destination charge actually lands in the seller's balance with the platform
  fee deducted (`STRIPE_PLATFORM_FEE_PERCENT`).
- [ ] 🟠 **`pendingCheckout` rows are cleaned up.** Confirm/webhook delete on
  success, but abandoned (unpaid) sessions leave rows forever — add a TTL/sweep
  or you'll accumulate orphans.
- [ ] 🟠 **Subscriptions are either finished or hidden.** The checkout route
  rejects `SUBSCRIPTION` products and nothing creates subscription checkouts, yet
  the UI exposes subscription concepts. Either wire it up or hide it so users
  can't hit a dead end.
- [ ] 🟡 **Tax** — VAT (EU/UK) and US sales-tax nexus. Decide on Stripe Tax
  before taking cross-border money, not after.

## Environment & infrastructure

- [ ] 🔴 `NEXTAUTH_URL` / `siteUrl` point at the production domain (used in
  `app/layout.tsx`, checkout success/cancel URLs, emails).
- [ ] 🔴 Production database provisioned and **migrations deployed**
  (`npm run db:deploy`), not dev push.
- [ ] 🔴 All required secrets set in prod: `STRIPE_SECRET_KEY` (live),
  `STRIPE_WEBHOOK_SECRET` (live), `NEXTAUTH_SECRET`, DB URL, email creds,
  Upstash (rate limiting) — and **no test keys** linger.
- [ ] 🟠 **Email deliverability**: domain SPF/DKIM/DMARC configured so order
  confirmations and verification mails don't land in spam.
- [ ] 🟠 The `register()` instrumentation runtime warning is resolved _(done)_ and
  a clean `.next` build passes (`npm run build`) — note the stale
  `api/paypal/account` type reference clears on a fresh build.

## Legal & content (see LEGAL-AUDIT.md)

- [x] Cookie consent banner gating analytics/marketing _(done)_.
- [ ] 🔴 Build the **data-export** endpoint (privacy policy promises it).
- [ ] 🔴 Create the **Creator Agreement** page and fix the other 404 footer links
  (`/changelog`, `/roadmap`, `/docs`, `/status`, `/blog`, `/careers`, `/press`).
- [ ] 🟠 Replace placeholder company entity + `legal@`/`support@` addresses with
  real, monitored ones.
- [ ] 🟠 Age gate at signup matching the youngest market served.

## Trust, security & ops

- [ ] 🟠 Run `/security-review` on the branch before launch.
- [ ] 🟠 Error monitoring is live — `onRequestError` in `instrumentation.ts`
  forwards to a real service (not just `console`).
- [ ] 🟡 Rate limits applied to auth + checkout + webhook endpoints.
- [ ] 🟡 A basic uptime/health check and a rollback plan.

---

**Bottom line:** flipping to live keys is one 🔴 among several. The order-fulfillment
backstop was the highest-risk gap and is now fixed; the remaining 🔴s
(webhook registration, live end-to-end test, payouts, prod env, data-export,
dead legal links) are what actually gate "complete."
