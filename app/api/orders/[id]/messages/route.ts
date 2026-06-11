import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField } from "@/lib/sanitize";
import { moderateText } from "@/lib/moderation";
import { notify } from "@/lib/notify";
import { getActiveAccount, can } from "@/lib/team";

// Resolve the order and the caller's role. The seller side is checked against
// the effective account owner so staff (acting as an owner) are authorized too.
async function loadOrderForUser(orderId: string, userId: string, sellerCheckId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true, buyerId: true,
      items: { select: { product: { select: { userId: true, name: true } } } },
    },
  });
  if (!order) return null;
  const sellerIds = [...new Set(order.items.map(i => i.product?.userId).filter(Boolean) as string[])];
  const isBuyer = order.buyerId === userId;
  const isSeller = sellerIds.includes(sellerCheckId);
  if (!isBuyer && !isSeller) return null;
  return { order, isBuyer, isSeller, sellerIds };
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const account = await getActiveAccount(session.user.id);
  const ctx = await loadOrderForUser(id, session.user.id, account.ownerId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.isSeller && !ctx.isBuyer && !can(account, "orders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db.orderMessage.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(messages.map(m => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === session.user!.id,
    senderName: m.sender.name ?? "User",
    senderImage: m.sender.image,
  })));
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const account = await getActiveAccount(session.user.id);
  const ctx = await loadOrderForUser(id, session.user.id, account.ownerId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.isSeller && !ctx.isBuyer && !can(account, "orders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = sanitizeField((await req.json()).body, 2000).trim();
  if (!body) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const mod = moderateText(body);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 422 });

  const message = await db.orderMessage.create({
    data: { orderId: id, senderId: session.user.id, body },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  // Notify the counterpart(s): if the sender is the buyer, notify the seller(s); else the buyer.
  const recipients = ctx.isBuyer ? ctx.sellerIds : (ctx.order.buyerId ? [ctx.order.buyerId] : []);
  const orderNo = id.slice(-8).toUpperCase();
  await Promise.all(
    recipients.filter(r => r !== session.user!.id).map(userId =>
      notify({
        userId,
        type: "ORDER_MESSAGE",
        title: "New message about an order",
        body: `${message.sender.name ?? "Someone"} sent a message about order #${orderNo}.`,
        data: { orderId: id },
        link: "/orders",
      }).catch(() => null)
    )
  );

  return NextResponse.json({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    mine: true,
    senderName: message.sender.name ?? "You",
    senderImage: message.sender.image,
  }, { status: 201 });
}
