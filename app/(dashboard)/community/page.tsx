"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Share2, Users, TrendingUp, Bookmark,
  MoreHorizontal, Image as ImageIcon, Loader2, Send, Trash2, Check, Flag,
  ThumbsUp, Flame, Clock, Lock, Globe, Plus, X, UsersRound,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// Compact vote score (1200 → "1.2k"), Reddit-style.
function voteScore(n: number) {
  return Math.abs(n) >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

const ACTION_BTN =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors";

function Avatar({ name, image, size = "md" }: { name?: string | null; image?: string | null; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  if (image) return <img src={image} alt={name ?? ""} className={`${cls} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${cls} rounded-full bg-nexus-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitials(name ?? "?")}
    </div>
  );
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [feedTab, setFeedTab] = useState<"forYou" | "following">("forYou");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [groups, setGroups] = useState<{ myGroups: any[]; discover: any[]; pending: any[] }>({ myGroups: [], discover: [], pending: [] });
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState<{ name: string; description: string; visibility: "PUBLIC" | "PRIVATE" }>({ name: "", description: "", visibility: "PUBLIC" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [myStats, setMyStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Set<string>>(new Set());
  const [commentError, setCommentError] = useState<Record<string, string>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentUser = session?.user;

  // Load the feed: a selected group's posts, the following feed, or the main feed.
  // Retries a couple of times so a transient hiccup doesn't leave the page blank.
  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    const url = selectedGroup
      ? `/api/posts?group=${selectedGroup.id}`
      : feedTab === "following"
      ? "/api/posts?feed=following"
      : "/api/posts";
    let attempt = 0;
    const run = (): Promise<void> =>
      fetch(url)
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((data) => {
          if (cancelled) return;
          const fetched = data.posts ?? [];
          setPosts(fetched);
          setLikedPosts(new Set(fetched.filter((p: any) => p.likedByMe).map((p: any) => p.id)));
        })
        .catch(async () => {
          if (attempt < 2 && !cancelled) {
            attempt++;
            await new Promise((r) => setTimeout(r, 400 * attempt));
            return run();
          }
          if (!cancelled) setPosts([]);
        });
    run().finally(() => { if (!cancelled) setLoadingPosts(false); });
    return () => { cancelled = true; };
  }, [feedTab, selectedGroup]);

  const loadGroups = useCallback(() => {
    let attempt = 0;
    const run = (): Promise<void> =>
      fetch("/api/groups")
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((data) => setGroups(data))
        .catch(async () => {
          if (attempt < 2) {
            attempt++;
            await new Promise((r) => setTimeout(r, 400 * attempt));
            return run();
          }
        });
    run();
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    fetch("/api/follow")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.suggestions ?? []);
        setFollowingUsers(new Set<string>(data.following ?? []));
      });
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((u) => {
        if (u?.id) {
          setMyUsername(u.username ?? null);
          setMyStats({
            followers: u._count?.following ?? 0,
            following: u._count?.followers ?? 0,
            posts: u._count?.posts ?? 0,
          });
        }
      });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;
    const handler = () => { setOpenMenu(null); setReportFor(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenu]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setPostImages((prev) => [...prev, data.url]);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postText, images: postImages, groupId: selectedGroup?.id ?? null }),
      });
      if (res.ok) {
        const newPost = await res.json();
        // Prepend when the new post belongs to the view we're looking at.
        if (selectedGroup || feedTab === "forYou") setPosts((prev) => [newPost, ...prev]);
        setPostText("");
        setPostImages([]);
        setMyStats((s) => ({ ...s, posts: s.posts + 1 }));
      } else {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error ?? "Couldn't post. Please try again.");
      }
    } finally {
      setPosting(false);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;
    setCreatingGroup(true);
    setGroupError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });
      if (res.ok) {
        const g = await res.json();
        setGroups((prev) => ({ ...prev, myGroups: [g, ...prev.myGroups] }));
        setShowCreateGroup(false);
        setNewGroup({ name: "", description: "", visibility: "PUBLIC" });
        setSelectedGroup(g);
      } else {
        const data = await res.json().catch(() => ({}));
        setGroupError(data.error ?? "Couldn't create group. Please try again.");
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  const joinGroup = async (g: any) => {
    const res = await fetch(`/api/groups/${g.id}/join`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "ACTIVE") {
      setGroups((prev) => ({
        ...prev,
        myGroups: [{ ...g, role: "MEMBER", members: (g.members ?? 0) + 1 }, ...prev.myGroups],
        discover: prev.discover.filter((d) => d.id !== g.id),
      }));
      setSelectedGroup({ ...g, role: "MEMBER" });
    } else {
      setRequested((prev) => new Set(prev).add(g.id)); // PENDING request for a private group
    }
  };

  const leaveGroup = async (g: any) => {
    const res = await fetch(`/api/groups/${g.id}/join`, { method: "DELETE" });
    if (!res.ok) return;
    setGroups((prev) => ({ ...prev, myGroups: prev.myGroups.filter((m) => m.id !== g.id) }));
    if (selectedGroup?.id === g.id) setSelectedGroup(null);
  };

  const approveMember = async (groupId: string, userId: string, action: "approve" | "decline") => {
    await fetch(`/api/groups/${groupId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setGroups((prev) => ({ ...prev, pending: prev.pending.filter((p) => !(p.groupId === groupId && p.user.id === userId)) }));
  };

  const handleLike = async (postId: string) => {
    const alreadyLiked = likedPosts.has(postId);
    // Optimistic update
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, likes: p.likes + (alreadyLiked ? -1 : 1) } : p)
    );
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      // Reconcile with server truth
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, likes: data.likes } : p)
      );
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (data.liked) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const handleFollow = async (targetUserId: string) => {
    setFollowLoading((prev) => new Set([...prev, targetUserId]));
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.following) {
        setFollowingUsers((prev) => { const n = new Set(prev); n.add(targetUserId); return n; });
        setMyStats((s) => ({ ...s, following: s.following + 1 }));
        setSuggestions((prev) => prev.filter((s: any) => s.id !== targetUserId));
      } else {
        setFollowingUsers((prev) => { const n = new Set(prev); n.delete(targetUserId); return n; });
        setMyStats((s) => ({ ...s, following: Math.max(0, s.following - 1) }));
      }
    } finally {
      setFollowLoading((prev) => { const n = new Set(prev); n.delete(targetUserId); return n; });
    }
  };

  const handleReport = async (postId: string, reason: string) => {
    setReportFor(null);
    setOpenMenu(null);
    try {
      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "post", targetId: postId, reason }) });
      setReportMsg("Report submitted, our team will review it.");
      setTimeout(() => setReportMsg(""), 3000);
    } catch { /* ignore */ }
  };

  const handleShare = (postId: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}/posts/${postId}`);
    setCopiedPost(postId);
    setTimeout(() => setCopiedPost(null), 2000);
  };

  const handleBookmark = (postId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const handleToggleComments = async (postId: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) { next.delete(postId); return next; }
      next.add(postId);
      return next;
    });
    if (!comments[postId]) {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentLoading((prev) => new Set([...prev, postId]));
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setCommentError((prev) => { const n = { ...prev }; delete n[postId]; return n; });
        setPosts((prev) =>
          prev.map((p) => p.id === postId
            ? { ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }
            : p
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setCommentError((prev) => ({ ...prev, [postId]: data.error ?? "Couldn't post comment." }));
      }
    } finally {
      setCommentLoading((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMyStats((s) => ({ ...s, posts: Math.max(0, s.posts - 1) }));
    }
    setOpenMenu(null);
  };

  // Apply the active sort (Following feed is fetched server-side and stays newest-first).
  const sortedPosts = (() => {
    if (feedTab === "following" || sort === "new") return posts;
    const hot = (p: any) =>
      (p.likes ?? 0) / Math.pow((Date.now() - new Date(p.createdAt).getTime()) / 3_600_000 + 2, 1.5);
    const list = [...posts];
    list.sort(sort === "top"
      ? (a, b) => (b.likes ?? 0) - (a.likes ?? 0)
      : (a, b) => hot(b) - hot(a));
    return list;
  })();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {reportMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm shadow-lg flex items-center gap-2">
          <Flag className="w-4 h-4" /> {reportMsg}
        </div>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Group context header */}
          {selectedGroup && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-gray-700 text-sm font-medium flex-shrink-0">← Community</button>
              <div className="w-px h-5 bg-gray-200" />
              <div className="w-9 h-9 rounded-xl bg-nexus-500/15 flex items-center justify-center flex-shrink-0">
                <UsersRound className="w-4.5 h-4.5 text-nexus-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-gray-900 truncate">{selectedGroup.name}</h2>
                  {selectedGroup.visibility === "PRIVATE"
                    ? <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    : <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                </div>
                <p className="text-gray-400 text-xs">{selectedGroup.members ?? 0} members · {selectedGroup.visibility === "PRIVATE" ? "Private group" : "Public group"}</p>
              </div>
              {selectedGroup.role !== "OWNER" && (
                <button onClick={() => leaveGroup(selectedGroup)} className="text-xs font-semibold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex-shrink-0">Leave</button>
              )}
            </div>
          )}

          {/* Create post */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Avatar name={currentUser?.name} image={currentUser?.image} />
              <div className="flex-1">
                <textarea
                  value={postText}
                  onChange={(e) => { setPostText(e.target.value); if (postError) setPostError(null); }}
                  placeholder={selectedGroup ? `Share something in ${selectedGroup.name}…` : "Share something with your community..."}
                  rows={3}
                  className="w-full bg-transparent text-gray-700 text-sm placeholder:text-gray-400 resize-none focus:outline-none leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
                  }}
                />
                {postImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {postImages.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="h-16 w-16 object-cover rounded-lg" />
                        <button
                          onClick={() => setPostImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      title="Add image"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      {uploadingImage
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ImageIcon className="w-4 h-4" />
                      }
                    </button>
                  </div>
                  <Button variant="lime" size="sm" disabled={!postText.trim() || posting} onClick={handlePost}>
                    {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Post
                  </Button>
                </div>
                {postError && <p className="text-red-500 text-xs mt-2">{postError}</p>}
              </div>
            </div>
          </div>

          {/* Sort bar (hidden inside a group feed) */}
          {!selectedGroup && (
          <div className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 flex items-center gap-1">
            {([
              { id: "hot", label: "Hot", icon: Flame },
              { id: "new", label: "New", icon: Clock },
              { id: "top", label: "Top", icon: TrendingUp },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setSort(id); if (feedTab === "following") setFeedTab("forYou"); }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  sort === id && feedTab === "forYou" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <button
              onClick={() => setFeedTab(feedTab === "following" ? "forYou" : "following")}
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors",
                feedTab === "following" ? "bg-nexus-600 text-white" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Users className="w-4 h-4" />
              Following
            </button>
          </div>
          )}

          {/* Posts */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              {feedTab === "following" ? (
                <>
                  <p className="text-gray-900 font-semibold mb-1">No posts from people you follow</p>
                  <p className="text-gray-400 text-sm">Follow some creators to see their posts here.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-900 font-semibold mb-1">No posts yet</p>
                  <p className="text-gray-400 text-sm">Be the first to share something with the community!</p>
                </>
              )}
            </div>
          ) : (
            sortedPosts.map((post) => {
              const liked = likedPosts.has(post.id);
              const bookmarked = bookmarks.has(post.id);
              const copied = copiedPost === post.id;
              const isOwn = post.user?.id === currentUser?.id;
              const menuOpen = openMenu === post.id;
              const commentsOpen = openComments.has(post.id);
              const postComments = comments[post.id] ?? [];
              const authorName = post.user?.name ?? "Unknown";
              return (
                <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all">
                  <div className="min-w-0">
                    <div className="p-3 sm:p-4">
                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Avatar name={authorName} image={post.user?.image} size="sm" />
                        <Link href={post.user?.username ? `/u/${post.user.username}` : "#"} className="font-semibold text-gray-600 hover:underline">
                          {post.user?.username ? `u/${post.user.username}` : authorName}
                        </Link>
                        <span className="text-gray-300">·</span>
                        <span>{timeAgo(post.createdAt)}</span>
                        {!isOwn && (
                          <button
                            onClick={() => handleFollow(post.user.id)}
                            disabled={followLoading.has(post.user.id)}
                            className={cn("ml-1 font-semibold transition-colors",
                              followingUsers.has(post.user.id) ? "text-gray-400" : "text-nexus-600 hover:text-nexus-700")}
                          >
                            {followingUsers.has(post.user.id) ? "Following" : "+ Follow"}
                          </button>
                        )}
                        <div className="ml-auto relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(menuOpen ? null : post.id); }}
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[150px]"
                            >
                              {reportFor === post.id ? (
                                <>
                                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Report reason</p>
                                  {["spam", "scam", "abuse", "illegal", "other"].map((reason) => (
                                    <button key={reason} onClick={() => handleReport(post.id, reason)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors capitalize">
                                      {reason}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {isOwn && (
                                    <button onClick={() => handleDeletePost(post.id)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete post
                                    </button>
                                  )}
                                  <button onClick={() => { handleShare(post.id); setOpenMenu(null); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Share2 className="w-3.5 h-3.5" /> Copy link
                                  </button>
                                  {!isOwn && (
                                    <button onClick={() => setReportFor(post.id)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                      <Flag className="w-3.5 h-3.5" /> Report
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">{post.content}</p>

                      {post.images?.length > 0 && (
                        <div className="rounded-lg overflow-hidden mt-2.5 border border-gray-100">
                          <img src={post.images[0]} alt="" className="w-full object-cover max-h-96" />
                        </div>
                      )}

                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {post.tags.map((tag: string) => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-nexus-50 text-nexus-600 border border-nexus-500/15">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action bar */}
                      <div className="flex items-center gap-0.5 mt-2.5 -ml-1">
                        <button onClick={() => handleLike(post.id)} className={cn(ACTION_BTN, liked && "text-nexus-600 bg-nexus-50")}>
                          <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} /> {voteScore(post.likes ?? 0)}
                        </button>
                        <button onClick={() => handleToggleComments(post.id)} className={cn(ACTION_BTN, commentsOpen && "bg-gray-100 text-gray-700")}>
                          <MessageSquare className="w-4 h-4" /> {post._count?.comments ?? 0} Comments
                        </button>
                        <button onClick={() => handleShare(post.id)} className={ACTION_BTN}>
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />} {copied ? "Copied" : "Share"}
                        </button>
                        <button onClick={() => handleBookmark(post.id)} className={cn(ACTION_BTN, bookmarked && "text-nexus-600")}>
                          <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} /> Save
                        </button>
                      </div>
                    </div>

                    {/* Comments panel */}
                    {commentsOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        <div className="px-4 py-3 space-y-3">
                        {postComments.length === 0 ? (
                          <p className="text-gray-400 text-xs text-center py-2">No comments yet. Be the first!</p>
                        ) : (
                          postComments.map((c: any) => (
                            <div key={c.id} className="flex items-start gap-2.5">
                              <Avatar name={c.user?.name} image={c.user?.image} size="sm" />
                              <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-gray-900 font-semibold text-xs">{c.user?.name ?? "Unknown"}</span>
                                  <span className="text-gray-400 text-xs">{timeAgo(c.createdAt)}</span>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Comment input */}
                        <div className="flex items-center gap-2.5 pt-1">
                          <Avatar name={currentUser?.name} image={currentUser?.image} size="sm" />
                          <div className="flex-1">
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                            <input
                              type="text"
                              value={commentText[post.id] ?? ""}
                              onChange={(e) => { const v = e.target.value; setCommentText((prev) => ({ ...prev, [post.id]: v })); if (commentError[post.id]) setCommentError((prev) => { const n = { ...prev }; delete n[post.id]; return n; }); }}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(post.id); } }}
                              placeholder="Write a comment..."
                              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!commentText[post.id]?.trim() || commentLoading.has(post.id)}
                              className="text-nexus-500 hover:text-nexus-600 disabled:opacity-40 transition-colors flex-shrink-0"
                            >
                              {commentLoading.has(post.id)
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />
                              }
                            </button>
                          </div>
                          {commentError[post.id] && <p className="text-red-500 text-xs mt-1 px-1">{commentError[post.id]}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Groups */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 font-semibold text-sm">Groups</h3>
              <button onClick={() => setShowCreateGroup(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-nexus-600 hover:text-nexus-700">
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>

            {groups.myGroups.length > 0 && (
              <div className="space-y-1 mb-3">
                {groups.myGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g)}
                    className={cn("w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors",
                      selectedGroup?.id === g.id ? "bg-nexus-50" : "hover:bg-gray-50")}
                  >
                    <div className="w-7 h-7 rounded-lg bg-nexus-500/15 flex items-center justify-center flex-shrink-0">
                      {g.visibility === "PRIVATE" ? <Lock className="w-3.5 h-3.5 text-nexus-600" /> : <UsersRound className="w-3.5 h-3.5 text-nexus-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{g.name}</div>
                      <div className="text-[11px] text-gray-400">{g.members ?? 0} members</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {groups.discover.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Discover</p>
                <div className="space-y-2">
                  {groups.discover.slice(0, 6).map((g) => (
                    <div key={g.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-800 truncate">{g.name}</div>
                        <div className="text-[11px] text-gray-400">{g.members ?? 0} members</div>
                      </div>
                      <button
                        onClick={() => joinGroup(g)}
                        disabled={requested.has(g.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full border border-nexus-200 text-nexus-600 hover:bg-nexus-50 disabled:opacity-50 flex-shrink-0"
                      >
                        {requested.has(g.id) ? "Requested" : "Join"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {groups.myGroups.length === 0 && groups.discover.length === 0 && (
              <p className="text-gray-400 text-xs">No groups yet, create the first one!</p>
            )}
          </div>

          {/* Pending join requests (for group owners) */}
          {groups.pending.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="text-gray-900 font-semibold text-sm mb-3">Join requests</h3>
              <div className="space-y-2.5">
                {groups.pending.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <Avatar name={p.user.name} image={p.user.image} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.user.name ?? p.user.username}</div>
                      <div className="text-[11px] text-gray-400 truncate">wants to join {p.groupName}</div>
                    </div>
                    <button onClick={() => approveMember(p.groupId, p.user.id, "approve")} className="text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg">Approve</button>
                    <button onClick={() => approveMember(p.groupId, p.user.id, "decline")} className="text-gray-400 hover:text-red-500" title="Decline"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="text-gray-900 font-semibold text-sm mb-3">Your Community</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Followers", value: myStats.followers, icon: Users },
                { label: "Following", value: myStats.following, icon: Users },
                { label: "Posts", value: myStats.posts, icon: TrendingUp },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 rounded-xl bg-gray-50">
                  <div className="text-nexus-500 text-lg font-bold">{value}</div>
                  <div className="text-gray-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
            {myUsername && (
              <Link href={`/u/${myUsername}`} className="block mt-3 text-center text-xs font-semibold text-nexus-600 hover:text-nexus-700">
                View my profile →
              </Link>
            )}
          </div>

          {/* Suggested creators */}
          {suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="text-gray-900 font-semibold text-sm mb-3">Suggested Creators</h3>
              <div className="space-y-3">
                {suggestions.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Link href={s.username ? `/u/${s.username}` : "#"} className="flex items-center gap-3 flex-1 min-w-0 group/sug">
                      <Avatar name={s.name} image={s.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-700 text-sm font-medium truncate group-hover/sug:underline">{s.name ?? s.username}</div>
                        <div className="text-gray-400 text-xs">{s._count?.following ?? 0} followers</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleFollow(s.id)}
                      disabled={followLoading.has(s.id)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-all flex-shrink-0",
                        followingUsers.has(s.id)
                          ? "border-gray-200 text-gray-500 bg-gray-50"
                          : "border-nexus-200 text-nexus-600 hover:bg-nexus-50"
                      )}
                    >
                      {followingUsers.has(s.id) ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create group modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !creatingGroup && setShowCreateGroup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Create a group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">Group name</label>
            <input
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="e.g. Indie Game Devs"
              className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-nexus-500"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              rows={2}
              placeholder="What's this group about?"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-nexus-500"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {([
                { v: "PUBLIC", icon: Globe, label: "Public", desc: "Anyone can see and join" },
                { v: "PRIVATE", icon: Lock, label: "Private", desc: "Approval required to join" },
              ] as const).map(({ v, icon: Icon, label, desc }) => (
                <button
                  key={v}
                  onClick={() => setNewGroup({ ...newGroup, visibility: v })}
                  className={cn("text-left p-3 rounded-xl border transition-all",
                    newGroup.visibility === v ? "border-nexus-400 bg-nexus-50 ring-1 ring-nexus-400" : "border-gray-200 hover:border-gray-300")}
                >
                  <Icon className="w-4 h-4 text-gray-600 mb-1" />
                  <div className="text-sm font-semibold text-gray-800">{label}</div>
                  <div className="text-[11px] text-gray-400 leading-tight">{desc}</div>
                </button>
              ))}
            </div>

            {groupError && <p className="text-red-500 text-xs mb-2">{groupError}</p>}
            <Button variant="lime" className="w-full justify-center" disabled={!newGroup.name.trim() || creatingGroup} onClick={createGroup}>
              {creatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create group
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
