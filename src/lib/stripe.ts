import Stripe from "stripe";

// Lazy singleton — avoids crashing at build time when env vars aren't set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("sk_test_your")) {
      throw new Error("STRIPE_SECRET_KEY is not configured — add your real key to .env.local");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop: string | symbol) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

export function isPro(status?: string | null): boolean {
  return status === "active" || status === "trialing";
}
