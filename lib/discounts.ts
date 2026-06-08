// Shared discount-code validation used by the public validate endpoint, the
// checkout session creator, and the webhook. Keep all money math in cents.

export interface DiscountLike {
  code: string;
  type: string;        // "PERCENT" | "FIXED"
  value: number;
  active: boolean;
  minSubtotal: number;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: Date | null;
}

export function normalizeCode(code: string): string {
  return (code ?? "").toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

/** Cents discounted off a subtotal (clamped so it never exceeds the subtotal). */
export function discountAmountCents(d: Pick<DiscountLike, "type" | "value">, subtotalCents: number): number {
  if (d.type === "FIXED") return Math.min(Math.round(d.value * 100), subtotalCents);
  // PERCENT
  const pct = Math.max(0, Math.min(100, d.value));
  return Math.min(Math.round((subtotalCents * pct) / 100), subtotalCents);
}

export type DiscountCheck =
  | { ok: true; amountCents: number }
  | { ok: false; reason: string };

/** Validate a discount against a subtotal (in cents). */
export function checkDiscount(d: DiscountLike | null, subtotalCents: number): DiscountCheck {
  if (!d) return { ok: false, reason: "Invalid code" };
  if (!d.active) return { ok: false, reason: "This code is no longer active" };
  if (d.expiresAt && d.expiresAt.getTime() < Date.now()) return { ok: false, reason: "This code has expired" };
  if (d.usageLimit != null && d.usageCount >= d.usageLimit) return { ok: false, reason: "This code has reached its usage limit" };
  if (subtotalCents < Math.round(d.minSubtotal * 100)) {
    return { ok: false, reason: `Order must be at least $${d.minSubtotal.toFixed(2)} to use this code` };
  }
  const amountCents = discountAmountCents(d, subtotalCents);
  if (amountCents <= 0) return { ok: false, reason: "This code has no effect on your order" };
  return { ok: true, amountCents };
}
