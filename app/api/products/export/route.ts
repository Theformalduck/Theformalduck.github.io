import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { getActiveAccount, can } from "@/lib/team";

export const COLUMNS = ["name", "description", "price", "compare_price", "type", "status", "inventory", "image_urls"] as const;

// Download all products on the active account as a CSV.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to export products." }, { status: 403 });

  const products = await db.product.findMany({
    where: { userId: account.ownerId },
    orderBy: { createdAt: "desc" },
    select: { name: true, description: true, price: true, comparePrice: true, type: true, status: true, inventory: true, images: true },
  });

  const rows: (string | number | null)[][] = [
    [...COLUMNS],
    ...products.map(p => [
      p.name,
      p.description ?? "",
      p.price,
      p.comparePrice ?? "",
      p.type,
      p.status,
      p.inventory ?? "",
      (p.images ?? []).join("|"),
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="products.csv"`,
    },
  });
}
