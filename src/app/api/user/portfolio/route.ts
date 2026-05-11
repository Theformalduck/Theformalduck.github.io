import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await prisma.portfolio.findUnique({ where: { userId: session.user.id } });
  if (!row) return NextResponse.json({ data: null });
  return NextResponse.json({
    data:      JSON.parse(row.data),
    theme:     row.theme,
    subdomain: row.subdomain,
    published: row.published,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, theme, subdomain, published } = await req.json();
  await prisma.portfolio.upsert({
    where:  { userId: session.user.id },
    update: { data: JSON.stringify(data), theme: theme ?? "minimal", subdomain: subdomain ?? null, published: published ?? false },
    create: { userId: session.user.id, data: JSON.stringify(data), theme: theme ?? "minimal", subdomain: subdomain ?? null, published: published ?? false },
  });
  return NextResponse.json({ ok: true });
}
