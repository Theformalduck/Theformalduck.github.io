"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart, MessageSquare, Share2, Users, TrendingUp, Bookmark,
  MoreHorizontal, Image as ImageIcon, Loader2, Send, Trash2, Check, Flag,
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
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentUser = session?.user;

  const loadPosts = useCallback((tab: "forYou" | "following" = "forYou") => {
    setLoadingPosts(true);
    const url = tab === "following" ? "/api/posts?feed=following" : "/api/posts";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const fetched = data.posts ?? [];
        setPosts(fetched);
        setLikedPosts(new Set(fetched.filter((p: any) => p.likedByMe).map((p: any) => p.id)));
      })
      .catch((err) => console.error("[loadPosts]", err))
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    loadPosts(feedTab);
  }, [loadPosts, feedTab]);

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
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postText, images: postImages }),
      });
      if (res.ok) {
        const newPost = await res.json();
        // Only prepend to feed if on "For You" — following feed only shows others' posts
        if (feedTab === "forYou") setPosts((prev) => [newPost, ...prev]);
        setPostText("");
        setPostImages([]);
        setMyStats((s) => ({ ...s, posts: s.posts + 1 }));
      }
    } finally {
      setPosting(false);
    }
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
      setReportMsg("Report submitted — our team will review it.");
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
        setPosts((prev) =>
          prev.map((p) => p.id === postId
            ? { ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }
            : p
          )
        );
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
          {/* Create post */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Avatar name={currentUser?.name} image={currentUser?.image} />
              <div className="flex-1">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share something with your community..."
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
              </div>
            </div>
          </div>

          {/* Feed tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            {(["forYou", "following"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFeedTab(tab)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-xl transition-all",
                  feedTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab === "forYou" ? "For You" : "Following"}
              </button>
            ))}
          </div>

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
            posts.map((post) => {
              const liked = likedPosts.has(post.id);
              const bookmarked = bookmarks.has(post.id);
              const copied = copiedPost === post.id;
              const isOwn = post.user?.id === currentUser?.id;
              const menuOpen = openMenu === post.id;
              const commentsOpen = openComments.has(post.id);
              const postComments = comments[post.id] ?? [];
              const authorName = post.user?.name ?? "Unknown";
              const authorRole = post.user?.role ?? "";
              return (
                <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Link href={post.user?.username ? `/u/${post.user.username}` : "#"} className="flex items-center gap-3 group/author">
                        <Avatar name={authorName} image={post.user?.image} />
                        <div>
                          <div className="text-gray-900 font-semibold text-sm group-hover/author:underline">{authorName}</div>
                          <div className="text-gray-400 text-xs">{authorRole.toLowerCase()} · {timeAgo(post.createdAt)}</div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {!isOwn && (
                          <button
                            onClick={() => handleFollow(post.user.id)}
                            disabled={followLoading.has(post.user.id)}
                            className={cn(
                              "text-xs px-3 py-1 rounded-full border transition-all",
                              followingUsers.has(post.user.id)
                                ? "border-gray-200 text-gray-500 bg-gray-50"
                                : "border-nexus-200 text-nexus-600 hover:bg-nexus-50"
                            )}
                          >
                            {followingUsers.has(post.user.id) ? "Following" : "Follow"}
                          </button>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(menuOpen ? null : post.id); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
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
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-3">{post.content}</p>

                    {post.images?.length > 0 && (
                      <div className="rounded-xl overflow-hidden mb-3">
                        <img src={post.images[0]} alt="" className="w-full object-cover max-h-64" />
                      </div>
                    )}

                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag: string) => (
                          <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-nexus-50 text-nexus-600 border border-nexus-500/15">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                          liked ? "text-nexus-600 bg-nexus-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                        {post.likes}
                      </button>
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                          commentsOpen ? "text-nexus-600 bg-nexus-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {post._count?.comments ?? 0}
                      </button>
                      <button
                        onClick={() => handleShare(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                          copied ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        {copied ? "Copied!" : "Share"}
                      </button>
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={cn(
                          "ml-auto w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                          bookmarked ? "text-nexus-600 bg-nexus-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
                      </button>
                    </div>
                  </div>

                  {/* Comments panel */}
                  {commentsOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="px-5 py-3 space-y-3">
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
                          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                            <input
                              type="text"
                              value={commentText[post.id] ?? ""}
                              onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
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
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
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
    </div>
  );
}
