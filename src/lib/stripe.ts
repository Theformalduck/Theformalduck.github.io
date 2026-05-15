import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export function isPro(status?: string | null): boolean {
  return status === "active" || status === "trialing";
}
