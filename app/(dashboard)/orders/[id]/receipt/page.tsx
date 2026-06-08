export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await props.params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { name: true, userId: true } } } },
    },
  });
  if (!order) notFound();

  const sellerIds = [...new Set(order.items.map(i => i.product?.userId).filter(Boolean) as string[])];
  const isBuyer = order.buyer?.id === session.user.id;
  const isSeller = sellerIds.includes(session.user.id);
  if (!isBuyer && !isSeller) notFound();

  const seller = await db.user.findFirst({
    where: { id: { in: sellerIds } },
    select: { name: true, username: true, email: true, store: { select: { name: true } } },
  });
  const storeName = seller?.store?.name ?? seller?.name ?? "Store";

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNo = order.id.slice(-8).toUpperCase();
  const customer = order.buyer?.name ?? order.buyer?.email ?? order.guestEmail ?? "Guest";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receipt</h1>
            <p className="text-sm text-gray-500 mt-0.5">{storeName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Order</p>
            <p className="font-mono font-semibold text-gray-900">#{orderNo}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Billed to</p>
            <p className="text-gray-900">{customer}</p>
            {order.buyer?.email && <p className="text-gray-500">{order.buyer.email}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
            <p className="text-gray-900 capitalize">{order.status.toLowerCase()}</p>
            {order.trackingNumber && <p className="text-gray-500 text-xs mt-1">Tracking: {order.trackingNumber}</p>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wide font-medium">Item</th>
              <th className="text-center py-2 text-xs text-gray-400 uppercase tracking-wide font-medium">Qty</th>
              <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wide font-medium">Price</th>
              <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wide font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.product?.name ?? "Product"}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total</span><span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">Thank you for your purchase · {storeName}</p>
      </div>
    </div>
  );
}
