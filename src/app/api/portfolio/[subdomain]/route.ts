import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  const row = await prisma.portfolio.findFirst({
    where: { subdomain, published: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    data:      JSON.parse(row.data),
    theme:     row.theme,
    subdomain: row.subdomain,
  });
}
