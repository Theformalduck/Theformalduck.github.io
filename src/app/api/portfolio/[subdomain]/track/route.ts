import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function classifyReferrer(referrer?: string | null, utmSource?: string | null): string {
  if (utmSource) return utmSource;
  if (!referrer) return "Direct";
  const r = referrer.toLowerCase();
  if (r.includes("linkedin.com")) return "LinkedIn";
  if (r.includes("google.")) return "Google";
  if (r.includes("github.com")) return "GitHub";
  if (r.includes("twitter.com") || r.includes("t.co") || r.includes("x.com")) return "Twitter / X";
  if (r.includes("instagram.com")) return "Instagram";
  if (r.includes("facebook.com")) return "Facebook";
  if (r.includes("reddit.com")) return "Reddit";
  return "Other";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  const body = await req.json().catch(() => ({}));
  const referrer: string | null = body.referrer || null;
  const utmSource: string | null = body.utmSource || null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { subdomain, published: true },
    select: { id: true },
  });
  if (!portfolio) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.portfolioView.create({
    data: {
      portfolioId: portfolio.id,
      referrer,
      utmSource: utmSource ?? classifyReferrer(referrer, utmSource),
    },
  });

  return NextResponse.json({ ok: true });
}
