# Deployment Guide

Sellora is a Next.js 16 app with Prisma + PostgreSQL, NextAuth, Stripe Connect, and
email. This guide covers deploying to production, the required environment variables,
and the two account-setup steps (email + payments).

---

## 1. Deploy to Vercel (recommended)

The repo includes [`vercel.json`](./vercel.json) and a CI workflow
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) that type-checks, lints, and
builds on every push/PR.

1. Push the repo to GitHub.
2. In Vercel → **New Project** → import the repo. Framework auto-detects as **Next.js**.
3. The build command is `prisma generate && next build` (already set in `vercel.json`
   and `package.json`). `prisma generate` also runs on `postinstall`.
4. Add the environment variables below (Vercel → Project → Settings → Environment Variables).
5. Deploy. Set the production domain, then update `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`
   to that domain and redeploy.

> Any host that runs Next.js works (Render, Railway, Fly, a Node server). The security
> headers live in `next.config.ts`, so they apply regardless of host.

---

## 2. Required environment variables

Copy `.env.example` → set real values. Minimum to boot:

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase, Neon, RDS, etc.) |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ | `true` |
| `NEXTAUTH_URL` | ✅ | Your production URL (e.g. `https://app.sellora.com`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same production URL |
| `STRIPE_SECRET_KEY` | payments | `sk_live_...` (or `sk_test_...` to test) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | payments | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | payments | from the Stripe webhook you create (below) |
| `RESEND_API_KEY` *or* `EMAIL_SERVER_*` | email | see §3 |
| `EMAIL_FROM` | email | sender, e.g. `Sellora <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | uploads | file/image storage |
| `AUTH_GOOGLE_ID` / `_SECRET`, `AUTH_GITHUB_ID` / `_SECRET` | optional | OAuth sign-in |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | recommended | durable rate limiting in prod |

After setting `DATABASE_URL`, run migrations against the production DB once:

```bash
npx prisma migrate deploy
```

---

## 3. Email delivery

Email (verification, password reset, order confirmations) sends via the first provider
configured, in [`lib/email.ts`](./lib/email.ts):

1. **Resend (recommended).** Create an account at resend.com, verify your sending
   domain, then set `RESEND_API_KEY` and `EMAIL_FROM="You <noreply@yourdomain.com>"`.
   For a quick test before verifying a domain, use `EMAIL_FROM="onboarding@resend.dev"`
   (only delivers to your own Resend account email).
2. **SMTP (alternative).** Set `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`,
   `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` (works with Gmail app passwords,
   SendGrid SMTP, Mailgun, etc.).
3. **Nothing set:** emails are printed to the server console (handy in local dev —
   the verification/reset link appears in your terminal).

Verify: sign up with a real address → you should receive the verification email.

---

## 4. Live payments (Stripe Connect)

Sellora uses **Stripe Connect (Express)** so each creator gets paid directly, with a 5%
platform fee. The code is ready — each seller just completes onboarding once:

1. Set the three `STRIPE_*` vars above (start with **test** keys: `sk_test_` / `pk_test_`).
2. Create a webhook in the Stripe dashboard pointing to
   `https://YOUR_DOMAIN/api/webhooks/stripe` and subscribe to at least
   `checkout.session.completed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. As a seller: **Dashboard → Settings → Payments → Connect Stripe**. This calls
   `/api/stripe/connect`, which creates an Express account and returns Stripe's hosted
   onboarding link. Complete it (in test mode you can use Stripe's test data).
4. Once Stripe reports `charges_enabled: true`, that store can accept orders. Test a
   purchase with card `4242 4242 4242 4242`, any future expiry, any CVC.

Go live by swapping in `sk_live_` / `pk_live_` keys and re-onboarding sellers in live mode.

---

## 5. Production checklist

- [ ] `DATABASE_URL` points at the production DB; `prisma migrate deploy` has run
- [ ] `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` set to the prod domain
- [ ] Email provider configured and a test email received
- [ ] Stripe keys + webhook set; a test seller onboarded and a test charge completed
- [ ] Supabase storage keys set; an image upload works
- [ ] Upstash Redis set for rate limiting
- [ ] OAuth redirect URLs (Google/GitHub) include the prod domain, if used
- [ ] Legal pages reviewed by counsel (`/terms`, `/privacy`, `/cookies`)
