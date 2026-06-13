// ── Storefront analytics event hooks ─────────────────────────────────────────
// Pushes GA4-style ecommerce events onto `window.dataLayer` so a store owner's
// analytics stack (Google Tag Manager / GA4 via the Analytics settings, or any
// custom-code integration) can track the funnel: view_item → add_to_cart →
// begin_checkout → purchase. When the Meta Pixel is installed we also forward
// the matching standard events. No-ops server-side and when nothing listens.

export interface TrackedItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
}

export function trackEvent(
  event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  payload: { currency?: string; value?: number; transaction_id?: string; items?: TrackedItem[] } = {}
) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event, ecommerce: { currency: "USD", ...payload } });

    // Meta Pixel standard-event mapping (only when the pixel is present).
    if (typeof w.fbq === "function") {
      const FB_EVENTS: Record<string, string> = {
        view_item: "ViewContent",
        add_to_cart: "AddToCart",
        begin_checkout: "InitiateCheckout",
        purchase: "Purchase",
      };
      w.fbq("track", FB_EVENTS[event], {
        currency: payload.currency ?? "USD",
        value: payload.value,
        content_ids: payload.items?.map((i) => i.item_id),
        content_type: "product",
      });
    }
  } catch {
    /* analytics must never break the store */
  }
}
