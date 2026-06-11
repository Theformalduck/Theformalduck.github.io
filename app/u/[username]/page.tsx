export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username }, select: { name: true, bio: true, image: true } });
  if (!user) return {};
  const title = `${user.name ?? username} (@${username}) · Sellora`;
  const description = user.bio ?? `Follow ${user.name ?? username} on Sellora and explore their work.`;
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  return {
    title, description,
    openGraph: { title, description, url: `${appUrl}/u/${username}`, type: "profile", ...(user.image ? { images: [{ url: user.image }] } : {}) },
    twitter: { card: user.image ? "summary" : "summary", title, description },
  };
}

export default async function ProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true, name: true, username: true, image: true, bio: true, verified: true, role: true, createdAt: true,
      // NOTE: relation names are inverted – `following` rows = this user's followers,
      // `followers` rows = the people this user follows.
      _count: { select: { following: true, followers: true, posts: true } },
      portfolio: { select: { published: true } },
      store: { select: { name: true } },
      products: {
        where: { status: "ACTIVE" }, take: 12, orderBy: { createdAt: "desc" },
        select: { id: true, name: true, price: true, images: true, type: true },
      },
      posts: {
        take: 20, orderBy: { createdAt: "desc" },
        select: { id: true, content: true, images: true, tags: true, likes: true, createdAt: true, _count: { select: { comments: true } } },
      },
    },
  });

  if (!user) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const isOwner = viewerId === user.id;

  let isFollowing = false;
  if (viewerId && !isOwner) {
    const f = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
    }).catch(() => null);
    isFollowing = !!f;
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        username: user.username!,
        image: user.image,
        bio: user.bio,
        verified: user.verified,
        role: user.role,
        followers: user._count.following,   // people following this user
        following: user._count.followers,   // people this user follows
        postCount: user._count.posts,
        joined: user.createdAt.toISOString(),
      }}
      posts={user.posts.map((p) => ({
        id: p.id, content: p.content, images: p.images, tags: p.tags,
        likes: p.likes, comments: p._count.comments, createdAt: p.createdAt.toISOString(),
      }))}
      products={user.products.map((p) => ({ id: p.id, name: p.name, price: p.price, images: p.images, type: p.type }))}
      storeName={user.store?.name ?? null}
      hasStore={user.products.length > 0}
      hasPortfolio={!!user.portfolio?.published}
      isOwner={isOwner}
      isFollowing={isFollowing}
      isLoggedIn={!!viewerId}
    />
  );
}
