import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { sanitizeField, sanitizeArray } from "@/lib/sanitize";
import { getActiveAccount, can } from "@/lib/team";

const VALID_TYPES = ["DIGITAL", "PHYSICAL", "SERVICE", "SUBSCRIPTION"];

// Bulk-create products on the active account from a CSV.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to import products." }, { status: 403 });

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

  // Map header → column index (case/space insensitive).
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const iName = col("name"), iPrice = col("price");
  if (iName === -1 || iPrice === -1) {
    return NextResponse.json({ error: "CSV must include at least 'name' and 'price' columns" }, { status: 400 });
  }
  const iDesc = col("description"), iCompare = col("compare_price"), iType = col("type"),
        iStatus = col("status"), iInv = col("inventory"), iImages = col("image_urls");

  let created = 0;
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = sanitizeField(cells[iName] ?? "", 200);
    const priceNum = Number(cells[iPrice]);
    if (!name) { errors.push(`Row ${r + 1}: missing name`); continue; }
    if (!Number.isFinite(priceNum) || priceNum < 0) { errors.push(`Row ${r + 1} (${name}): invalid price`); continue; }

    let type = (iType !== -1 ? (cells[iType] ?? "").trim().toUpperCase() : "PHYSICAL") || "PHYSICAL";
    if (!VALID_TYPES.includes(type)) type = "PHYSICAL";
    const status = (iStatus !== -1 && (cells[iStatus] ?? "").trim().toUpperCase() === "ACTIVE") ? "ACTIVE" : "DRAFT";
    const compareNum = iCompare !== -1 ? Number(cells[iCompare]) : NaN;
    const invNum = iInv !== -1 ? Number(cells[iInv]) : NaN;
    const images = iImages !== -1 ? sanitizeArray((cells[iImages] ?? "").split("|").map(s => s.trim()).filter(Boolean), true) : [];

    try {
      await db.product.create({
        data: {
          userId: account.ownerId,
          name,
          description: iDesc !== -1 ? (sanitizeField(cells[iDesc] ?? "", 10000) || null) : null,
          price: priceNum,
          comparePrice: Number.isFinite(compareNum) && compareNum > 0 ? compareNum : null,
          type: type as any,
          status: status as any,
          inventory: Number.isFinite(invNum) ? Math.max(0, Math.floor(invNum)) : null,
          images,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Row ${r + 1} (${name}): failed to save`);
    }
  }

  return NextResponse.json({ created, errors, total: rows.length - 1 });
}
