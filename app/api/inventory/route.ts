import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, parseCsv } from "@/lib/csv";
import { getActiveAccount, can } from "@/lib/team";

// Export current stock levels as a CSV.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage inventory." }, { status: 403 });

  const products = await db.product.findMany({
    where: { userId: account.ownerId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, inventory: true },
  });

  const rows: (string | number | null)[][] = [
    ["product_id", "name", "type", "inventory"],
    ...products.map((p) => [p.id, p.name, p.type, p.inventory ?? ""]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="inventory.csv"` },
  });
}

// Bulk-update stock from a CSV. Matches each row to a product by product_id
// (preferred) or exact name, and sets its inventory. Only the active account's
// products are touched.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage inventory." }, { status: 403 });

  let csv = "";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) csv = String((await req.json()).csv ?? "");
    else csv = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const iId = header.indexOf("product_id");
  const iName = header.indexOf("name");
  const iInv = header.indexOf("inventory");
  if (iInv === -1 || (iId === -1 && iName === -1)) {
    return NextResponse.json({ error: "CSV must include an 'inventory' column and a 'product_id' or 'name' column." }, { status: 400 });
  }

  // Map of this account's products for matching.
  const owned = await db.product.findMany({ where: { userId: account.ownerId }, select: { id: true, name: true } });
  const byId = new Map(owned.map((p) => [p.id, p.id]));
  const byName = new Map(owned.map((p) => [p.name.trim().toLowerCase(), p.id]));

  let updated = 0;
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const invRaw = (cells[iInv] ?? "").trim();
    const inv = invRaw === "" ? null : Math.max(0, Math.floor(Number(invRaw)));
    if (inv !== null && !Number.isFinite(inv)) { errors.push(`Row ${r + 1}: invalid inventory`); continue; }

    let productId: string | undefined;
    if (iId !== -1 && cells[iId]) productId = byId.get(cells[iId].trim());
    if (!productId && iName !== -1 && cells[iName]) productId = byName.get(cells[iName].trim().toLowerCase());
    if (!productId) { errors.push(`Row ${r + 1}: no matching product`); continue; }

    try {
      await db.product.update({ where: { id: productId }, data: { inventory: inv } });
      updated++;
    } catch {
      errors.push(`Row ${r + 1}: failed to update`);
    }
  }

  return NextResponse.json({ updated, errors, total: rows.length - 1 });
}
