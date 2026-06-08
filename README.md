# Sellora

Sellora is a creator commerce platform — every creator gets a customizable storefront, a portfolio site, and crowdfunding campaigns under one account. It's built with the Next.js App Router, Prisma + PostgreSQL, NextAuth, and Stripe Connect.

## Features

- **Storefront builder** — a Shopify-style customizer with live preview (click any section to edit), drag-and-drop page sections (Home / Collection / Product), themes & templates, and a draft → publish workflow.
- **Commerce** — products with variants, swatches & per-variant images, metafields, collections, discount codes, multi-currency display, cart drawer or full cart page, and Stripe Connect checkout.
- **Order lifecycle** — confirmation, status + tracking emails, printable receipts, low-stock alerts, and a per-order buyer↔seller message thread.
- **Engagement** — account wishlists, newsletter subscriber capture (with CSV export), and product reviews with verified-purchase badges and seller replies.
- **Analytics** — a revenue/orders dashboard plus per-store SEO (OpenGraph, JSON-LD structured data) and pluggable analytics/script injection (GA4, Meta Pixel, custom code).
- Also: creator portfolios and crowdfunding campaigns.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with at least:

   ```bash
   DATABASE_URL=postgresql://...        # Postgres (e.g. Supabase) connection string
   NEXTAUTH_URL=http://localhost:3000
   AUTH_SECRET=...                      # NextAuth secret
   STRIPE_SECRET_KEY=sk_test_...        # optional — required for checkout
   STRIPE_WEBHOOK_SECRET=whsec_...      # optional — Stripe webhook signing secret
   RESEND_API_KEY=...                   # optional — transactional email (falls back to console)
   ```

3. Sync the database schema and generate the Prisma client:

   ```bash
   npx prisma db push --schema=prisma/schema.prisma
   npx prisma generate --schema=prisma/schema.prisma
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** PostgreSQL via Prisma (`@prisma/adapter-pg`)
- **Auth:** NextAuth (JWT sessions, credentials + OAuth)
- **Payments:** Stripe Connect (destination charges + platform fee)
- **Styling:** Tailwind CSS

## Project notes

- Prisma schema lives in `prisma/schema.prisma`. After any schema change run `db push` + `generate`, then restart the dev server (the Prisma client is cached in memory).
- Network/auth routing lives in `proxy.ts` (the Next 16 successor to `middleware.ts`).
- Deployment config is in `vercel.json` / `.github/workflows/ci.yml`; see `DEPLOYMENT.md`.
