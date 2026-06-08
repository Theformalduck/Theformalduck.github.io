export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EyeOff } from "lucide-react";
import Link from "next/link";
import PortfolioClient from "./portfolio-client";
import { CanvasRenderer } from "./canvas-renderer";

export async function generateMetadata(props: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const user = await db.user.findUnique({
    where: { username },
    select: {
      name: true, bio: true, image: true,
      portfolio: { select: { seoTitle: true, seoDesc: true } },
    },
  });
  if (!user) return {};
  const title = user.portfolio?.seoTitle ?? `${user.name ?? username} — Creator Profile`;
  const description = user.portfolio?.seoDesc ?? user.bio ?? `Check out ${user.name ?? username}'s creator profile.`;
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  return {
    title,
    description,
    openGraph: {
      title, description,
      url: `${appUrl}/${username}`,
      type: "profile",
      ...(user.image ? { images: [{ url: user.image }] } : {}),
    },
    twitter: {
      card: user.image ? "summary_large_image" : "summary",
      title, description,
      ...(user.image ? { images: [user.image] } : {}),
    },
  };
}

export default async function CreatorProfilePage(
  props: PageProps<"/[username]">
) {
  const { username } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      portfolio: {
        include: {
          sections: { orderBy: { order: "asc" } },
        },
        // canvasData is a scalar field — included automatically
      },
      campaigns: {
        where: { status: "ACTIVE" },
        take: 3,
        orderBy: { createdAt: "desc" },
      },
      products: {
        where: { status: "ACTIVE" },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { followers: true, following: true },
      },
    },
  });

  if (!user) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === user.id;

  if (!user.portfolio?.published && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
          <EyeOff className="w-6 h-6 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Portfolio not published yet</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          @{username} hasn&apos;t published their portfolio yet. Check back soon.
        </p>
        <Link href="/" className="text-sm text-[#2e9cfe] hover:text-[#1a8cf0] font-medium">
          ← Back to home
        </Link>
      </div>
    );
  }

  // If the portfolio was built with the canvas editor, render the canvas
  const canvasData = user.portfolio?.canvasData as any;
  if (canvasData?.version === 1) {
    return (
      <div style={{ minHeight: "100vh", background: (canvasData.pages?.[0]?.bg) ?? "#ffffff" }}>
        {isOwner && (
          <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999 }}>
            <a
              href="/portfolio"
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"8px 16px", borderRadius:12,
                background:"rgba(0,0,0,0.85)", color:"#fff",
                fontSize:13, fontWeight:600, textDecoration:"none",
                boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
              }}>
              ✏️ Edit portfolio
            </a>
          </div>
        )}
        <CanvasRenderer doc={canvasData} />
      </div>
    );
  }

  return (
    <PortfolioClient
      user={{
        id: user.id,
        name: user.name,
        username: user.username!,
        image: user.image,
        bio: user.bio,
        verified: user.verified,
        _count: user._count,
      }}
      portfolio={
        user.portfolio
          ? {
              id: user.portfolio.id,
              title: user.portfolio.title,
              template: user.portfolio.template,
              primaryColor: user.portfolio.primaryColor,
              published: user.portfolio.published,
            }
          : null
      }
      settings={(user.portfolio?.settings as any) ?? {}}
      sections={(user.portfolio?.sections ?? []).map(s => ({
        id: s.id,
        type: s.type,
        visible: s.visible,
        order: s.order,
        content: s.content as Record<string, any>,
      }))}
      campaigns={user.campaigns.map(c => ({
        id: c.id,
        title: c.title,
        raised: c.raised,
        goal: c.goal,
        deadline: c.deadline ? c.deadline.toISOString() : null,
        status: c.status,
      }))}
      products={user.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        type: p.type,
        images: p.images,
        description: p.description,
      }))}
      isOwner={isOwner}
    />
  );
}
