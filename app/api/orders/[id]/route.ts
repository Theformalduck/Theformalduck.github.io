import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeUrl } from "@/lib/sanitize";
import { sendEmailAfter, orderStatusEmail } from "@/lib/email";
import { getActiveAccount, can } from "@/lib/team";

const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "REFUNDED", "CANCELLED"] as const;
// Status changes that warrant a customer email.
const NOTIFY_STATUSES = new Set(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "orders")) return NextResponse.json({ error: "You don't have permission to manage orders." }, { status: 403 });

  const { id } = await props.params;
  const body = await req.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { email: true } },
      items: { include: { product: { select: { userId: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = order.items.some(item => item.product?.userId === account.ownerId);
  if (!isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trackingNumber = body.trackingNumber !== undefined ? (sanitizeField(body.trackingNumber, 100) || null) : undefined;
  const trackingUrl = body.trackingUrl !== undefined ? sanitizeUrl(body.trackingUrl) : undefined;

  const updated = await db.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(trackingUrl !== undefined && { trackingUrl }),
    },
  });

  // Notify the customer of the status change (best-effort; never blocks the update).
  if (status !== order.status && NOTIFY_STATUSES.has(status)) {
    const customerEmail = order.buyer?.email ?? order.guestEmail ?? null;
    if (customerEmail) {
      try {
        const seller = await db.user.findUnique({
          where: { id: account.ownerId },
          select: { username: true, store: { select: { name: true } } },
        });
        sendEmailAfter({
          to: customerEmail,
          subject: `Order #${order.id.slice(-8).toUpperCase()} – ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          html: orderStatusEmail({
            id: order.id,
            status: status as "SHIPPED" | "DELIVERED" | "PROCESSING" | "CANCELLED",
            storeName: seller?.store?.name ?? seller?.username ?? "the store",
            storeUsername: seller?.username ?? "",
            trackingNumber: updated.trackingNumber,
            trackingUrl: updated.trackingUrl,
          }),
        });
      } catch (e) {
        console.error("[orders PATCH] failed to send status email:", e);
      }
    }
  }

  return NextResponse.json(updated);
}
