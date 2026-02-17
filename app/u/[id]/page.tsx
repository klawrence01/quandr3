// /app/u/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function shortId(id?: string) {
  const s = safeStr(id);
  if (!s) return "";
  return s.length <= 10 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function UserProfilePage() {
  const params = useParams();

  const userId = useMemo(() => {
    const raw: any = (params as any)?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [viewerId, setViewerId] = useState("");
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  const viewingOwnProfile = viewerId && userId && viewerId === userId;

  async function refreshFollowState(meId: string, targetId: string) {
    const followersRes = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("followed_id", targetId);

    const followingRes = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", targetId);

    setStats({
      followers: followersRes?.count || 0,
      following: followingRes?.count || 0,
    });

    if (meId) {
      const rel = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", meId)
        .eq("followed_id", targetId)
        .maybeSingle();

      setIsFollowing(!!rel?.data);
    }
  }

  async function toggleFollow() {
    if (!viewerId || !userId || viewingOwnProfile) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("followed_id", userId);
    } else {
      await supabase.from("follows").insert({
        follower_id: viewerId,
        followed_id: userId,
      });
    }

    refreshFollowState(viewerId, userId);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setViewerId(data?.user?.id || "");
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);

      const profRes = await supabase
        .from("profiles")
        .select("id, display_name, what_i_know, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profRes?.data || {});

      const postsRes = await supabase
        .from("quandr3s")
        .select("id, title, status, created_at, category, city, country")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      setPosts(postsRes?.data || []);

      await refreshFollowState(viewerId, userId);

      setLoading(false);
    }

    load();
  }, [userId, viewerId]);

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>
            {safeStr(profile?.display_name) || `Curioso ${shortId(userId)}`}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {safeStr(profile?.what_i_know) || "No bio yet."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={toggleFollow}
              className="rounded-full px-5 py-2 text-sm font-extrabold text-white"
              style={{ background: viewingOwnProfile ? BLUE : isFollowing ? CORAL : TEAL }}
              disabled={!viewerId || viewingOwnProfile}
              title={viewingOwnProfile ? "This is you" : ""}
            >
              {viewingOwnProfile ? "This is you" : isFollowing ? "Unfollow" : "Follow"}
            </button>

            <Link
              href={`/u/${userId}/followers`}
              className="rounded-full border px-5 py-2 text-sm font-extrabold"
              style={{ color: NAVY }}
            >
              Followers ({stats.followers})
            </Link>

            <Link
              href={`/u/${userId}/following`}
              className="rounded-full border px-5 py-2 text-sm font-extrabold"
              style={{ color: NAVY }}
            >
              Following ({stats.following})
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold" style={{ color: NAVY }}>
            Latest Quandr3s
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : posts.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {posts.map((q) => (
                <Link
                  key={q.id}
                  href={`/q/${q.id}`}
                  className="rounded-2xl border p-4 hover:shadow-sm"
                >
                  <div className="font-extrabold text-slate-900">
                    {safeStr(q.title) || "Untitled"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {safeStr(q.category)} • {new Date(q.created_at).toLocaleDateString()}
                    {(q.city || q.country) ? ` • ${safeStr(q.city)}${q.country ? `, ${safeStr(q.country)}` : ""}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No posts yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
