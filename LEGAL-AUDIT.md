# Sellora — Legal & Compliance Audit

_Last reviewed: 2026-06-08_

> **Not legal advice.** This is an engineer's audit of where the *code* does or
> doesn't match the *promises* in your legal documents, plus common gaps for a
> creator-commerce SaaS. The actual documents and your overall compliance posture
> must be reviewed by qualified counsel for your company's jurisdiction(s).

Severity: 🔴 fix before public launch · 🟠 fix soon · 🟡 nice to have / verify

---

## Resolved in this change

- ✅ **Cookie consent banner added** (`components/consent/`, mounted in
  `components/providers.tsx`). Built to the strict EU opt-in bar: analytics and
  marketing cookies default OFF, "Reject all" is as prominent as "Accept all",
  and choices are re-openable from the footer "Cookie Settings" link.
- ✅ **Storefront tracking now gated by consent.** `app/[username]/store/store-scripts.tsx`
  previously injected Google Analytics 4 and the Meta Pixel unconditionally on
  page load. GA now requires `analytics` consent; Meta Pixel and arbitrary
  owner-supplied head/body code require `marketing` consent.
- ✅ **Cookie Policy updated** to describe the consent tool (`app/cookies/page.tsx`).

---

## Open items

### 🔴 1. Data-export / access right is promised but not implemented
`app/privacy/page.tsx` (§6) promises users can **access, correct, export, or
delete** their data. Delete exists (`app/api/user/delete/route.ts`) and
correct/edit exists (`app/api/user/profile`), but there is **no export
endpoint**. Under GDPR (right of access/portability) and CCPA (right to know),
users must be able to obtain a copy of their data. _Recommend:_ a
`GET /api/user/export` returning the user's records (profile, products, orders,
posts, etc.) as JSON, plus a button in account settings.

### 🔴 2. Dead "Creator Agreement" + other footer links (404)
`components/landing/footer.tsx` links to `/creator-agreement` in the **Legal**
column, but that page doesn't exist. Linking to a non-existent legal agreement is
worse than not linking at all. Same 404 problem for `/changelog`, `/roadmap`,
`/docs`, `/status`, `/blog`, `/careers`, `/press`. _Recommend:_ create the
Creator Agreement page (you reference revenue/payouts, so creators need terms),
and either build or remove the other links before launch.

### 🟠 3. Placeholder company / contact details
`components/site/info-page.tsx` hardcodes `Sellora Technologies, Inc.`,
`legal@sellora.com`, `support@sellora.com`. Confirm these are the **real**
registered entity and monitored inboxes — legal notices and data-subject
requests must actually reach someone. Many jurisdictions also require a physical
business address and (for EU) possibly an EU representative / DPO contact in the
privacy policy.

### 🟠 4. Age gating
`app/privacy/page.tsx` (§7) states the Service isn't for under-13s, but the
signup flow (`app/(auth)/signup`) should be checked for an age confirmation /
date-of-birth gate. For EU users the relevant age for consent to data processing
can be up to 16. _Recommend:_ add an age affirmation at signup and verify the
copy matches the youngest market you serve.

### 🟠 5. Consent logging / proof
The consent banner stores the visitor's choice in a cookie, which is fine for
*enforcement*, but GDPR expects you to be able to *demonstrate* consent. If you
need an audit trail (timestamp, version, categories), log consent server-side.
The consent record already carries `version` + `updatedAt` to support this.

### 🟡 6. Marketing email / subscriber consent
You have `subscribers` and `campaigns` features. Confirm that subscriber sign-up
captures explicit opt-in and that every marketing email has a working
**unsubscribe** link (CAN-SPAM, GDPR, CASL). Transactional email (verification,
receipts) is exempt; marketing is not.

### 🟡 7. Tax / VAT on sales
You sell via Stripe across (presumably) multiple countries. Selling digital
goods into the EU/UK triggers VAT obligations; US sales may trigger state sales
tax nexus. This is a business/accounting setup item (e.g. Stripe Tax), not a code
bug — flagging so it isn't missed.

### 🟡 8. Cookie Policy specificity
`app/cookies/page.tsx` describes categories well but lists no **specific**
cookies/SDKs. Strict EU guidance prefers naming concrete cookies, their purpose,
provider, and retention. Worth tightening once your final vendor list is fixed
(NextAuth session, Stripe, GA, Meta Pixel, the `sellora_consent` cookie).

### 🟡 9. Accessibility (ADA / EN 301 549 / EAA)
Not strictly "legal documents," but accessibility is increasingly a legal
requirement (US ADA suits; the EU Accessibility Act applies from mid-2025 to
e-commerce). Worth an a11y pass on the storefront and checkout.

---

## Verified OK

- Privacy, Terms, and Cookie policy pages exist and are reasonably complete,
  each with a "template — have counsel review" disclaimer.
- Account **deletion** is implemented and backs the privacy policy's deletion right.
- Passwords are hashed (`bcryptjs`), rate limiting is present (`@upstash/ratelimit`),
  and card data is handled by Stripe (no raw PAN stored) — consistent with the
  security claims in the privacy policy.

_(Unrelated note: `npx tsc --noEmit` surfaces a stale `.next/types` reference to a
removed `api/paypal/account/route` — pre-existing build-cache staleness, clears on
a clean `.next`.)_
