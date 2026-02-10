// app/u/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function statusPill(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "open") return { label: "Open", bg: "rgba(0,169,165,0.14)", fg: NAVY };
  if (s === "awaiting_user") return {
    label: "Internet Decided",
    bg: "rgba(255,107,107,0.16)",
    fg: NAVY,
  };
  if (s === "resolved") return { label: "Resolved", bg: "rgba(30,99,243,0.14)", fg: NAVY };
  return { label: safeStr(status || "—"), bg: "rgba(148,163,184,0.18)", fg: "rgb(100 116 139)" };
}

/**
 * Fetch a user's Quandr3s in a Phase-1 safe way.
 * Different builds may have different author columns, so we try a few.
 */
async function fetchUserQuandr3s(profileId: string) {
  const columnsToTry = ["author_id", "user_id", "creator_id", "created_by"];
  for (const col of columnsToTry) {
    const { data, error } = await supabase
      .from("quandr3s")
      .select("id,title,category,status,created_at,city,state,media_url,discussion_open")
      .eq(col, profileId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (!error) return { rows: data ?? [], usedCol: col, error: null };
  }
  // last attempt: just return none
  return { rows: [], usedCol: null, error: "Could not locate author column on quandr3s." };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();

  const profileId = useMemo(() => {
    const raw: any = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [me, setMe] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [profile, setProfile] = useState<any>(null);

  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [busyFollow, setBusyFollow] = useState<boolean>(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsInfo, setPostsInfo] = useState<any>(null);

  const isMe = useMemo(() => !!me?.id && !!profileId && me.id === profileId, [me, profileId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMe(data?.user ?? null);
    });
  }, []);

  async function refreshCounts(pid: string) {
    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", pid);

    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", pid);

    setFollowers(Number(followerCount || 0));
    setFollowing(Number(followingCount || 0));
  }

  async function refreshIsFollowing(pid: string, myId?: string) {
    if (!myId || myId === pid) {
      setIsFollowing(false);
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", myId)
      .eq("followed_id", pid)
      .maybeSingle();

    if (error) {
      // if RLS blocks select, don’t crash the UI; just assume false
      setIsFollowing(false);
      return;
    }
    setIsFollowing(!!data?.id);
  }

  async function load(pid: string) {
    setErr("");
    setLoading(true);

    // profile
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, city, state, created_at")
      .eq("id", pid)
      .maybeSingle();

    if (pErr) {
      setErr(pErr.message || "Could not load profile (RLS?)");
      setProfile(null);
      setLoading(false);
      return;
    }
    if (!p) {
      setErr("Profile not found.");
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(p);

    // counts
    await refreshCounts(pid);

    // follow relationship
    await refreshIsFollowing(pid, me?.id);

    // posts (best-effort)
    const info = await fetchUserQuandr3s(pid);
    setPosts(info.rows || []);
    setPostsInfo(info);

    setLoading(false);
  }

  useEffect(() => {
    if (!profileId) return;
    load(profileId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, me?.id]);

  async function handleFollowToggle() {
    if (!profileId) return;

    if (!me?.id) {
      router.push(`/login?next=/u/${profileId}`);
      return;
    }
    if (me.id === profileId) return;

    setBusyFollow(true);

    if (isFollowing) {
      // unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", me.id)
        .eq("followed_id", profileId);

      setBusyFollow(false);

      if (error) {
        alert(error.message || "Could not unfollow (RLS?)");
        return;
      }
      setIsFollowing(false);
      await refreshCounts(profileId);
      return;
    }

    // follow
    const { error } = await supabase.from("follows").insert({
      follower_id: me.id,
      followed_id: profileId,
    });

    setBusyFollow(false);

    if (error) {
      // unique constraint will trigger if already following
      await refreshIsFollowing(profileId, me.id);
      await refreshCounts(profileId);
      alert(error.message || "Could not follow (RLS?)");
      return;
    }

    setIsFollowing(true);
    await refreshCounts(profileId);
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Loading profile…
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Pulling profile, followers, and recent posts.
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (err || !profile) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Profile unavailable
            </div>
            <div className="mt-2 text-sm text-slate-600">{err || "Unknown error."}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/explore"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-extrabold text-white"
                style={{ background: BLUE }}
              >
                Back to Explore
              </Link>
              <button
                onClick={() => profileId && load(profileId)}
                className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm font-extrabold"
                style={{ borderColor: "rgba(15,23,42,0.12)", color: NAVY }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const name = safeStr(profile.display_name) || `Curioso ${String(profile.id).slice(0, 6)}`;
  const location =
    safeStr(profile.city) || safeStr(profile.state)
      ? `${safeStr(profile.city)}${profile.state ? `, ${safeStr(profile.state)}` : ""}`
      : "";

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top bar */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/explore" className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
            >
              <span className="text-lg" style={{ color: NAVY }}>
                ?
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Quandr3
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                ASK. SHARE. DECIDE.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/q/create"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create
            </Link>

            {me ? (
              <Link
                href="/account"
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              >
                Account
              </Link>
            ) : (
              <Link
                href={`/login?next=/u/${profile.id}`}
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Profile Header Card */}
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-3xl border bg-slate-50">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-slate-500">
                    ?
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-2xl font-extrabold" style={{ color: NAVY }}>
                  {name}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold">
                    Curioso
                  </span>
                  {location ? (
                    <span className="text-xs font-semibold text-slate-500">• {location}</span>
                  ) : null}
                  <span className="text-xs font-semibold text-slate-500">
                    • Joined {fmt(profile.created_at)}
                  </span>
                </div>

                {safeStr(profile.bio) ? (
                  <p className="mt-3 max-w-2xl text-sm text-slate-700">{safeStr(profile.bio)}</p>
                ) : (
                  <p className="mt-3 max-w-2xl text-sm text-slate-500">
                    Bio coming soon.
                  </p>
                )}
              </div>
            </div>

            {/* Follow box */}
            <div className="w-full md:w-[360px]">
              <div className="rounded-3xl border bg-slate-50 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      FOLLOWERS
                    </div>
                    <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                      {followers}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      FOLLOWING
                    </div>
                    <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                      {following}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {isMe ? (
                    <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
                      This is your profile.
                    </div>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      disabled={busyFollow}
                      className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm"
                      style={{
                        background: isFollowing ? NAVY : BLUE,
                        opacity: busyFollow ? 0.7 : 1,
                      }}
                    >
                      {busyFollow ? "Working…" : isFollowing ? "Following ✓ (Unfollow)" : "Follow"}
                    </button>
                  )}

                  {!me ? (
                    <div className="mt-3 text-xs text-slate-600">
                      Log in to follow people and build your feed.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Posts */}
        <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">
                RECENT QUANDR3S
              </div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                Latest posts from {name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                This is the rolling list of Quandr3s they’ve posted.
              </div>
            </div>

            {postsInfo?.usedCol ? (
              <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Source column: <b style={{ color: NAVY }}>{postsInfo.usedCol}</b>
              </div>
            ) : null}
          </div>

          {!posts?.length ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
              No posts found yet.
              {postsInfo?.error ? (
                <div className="mt-2 text-xs text-slate-500">{postsInfo.error}</div>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {posts.map((r: any) => {
                const pill = statusPill(r.status);
                return (
                  <div
                    key={r.id}
                    className="rounded-[26px] border bg-white p-5 shadow-sm transition md:hover:-translate-y-[2px] md:hover:shadow-lg"
                    style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                          {safeStr(r.title) || "Untitled Quandr3"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {r.category ? (
                            <>
                              <span className="font-semibold" style={{ color: NAVY }}>
                                {safeStr(r.category)}
                              </span>{" "}
                              •{" "}
                            </>
                          ) : null}
                          Created {fmt(r.created_at)}
                        </div>
                        {(r.city || r.state) ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {safeStr(r.city)}
                            {r.state ? `, ${safeStr(r.state)}` : ""}
                          </div>
                        ) : null}
                      </div>

                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-extrabold"
                        style={{ background: pill.bg, color: pill.fg }}
                      >
                        {pill.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Link
                        href={`/q/${r.id}`}
                        className="rounded-xl px-4 py-2 text-xs font-extrabold text-white"
                        style={{ background: BLUE }}
                      >
                        View
                      </Link>

                      {r.discussion_open ? (
                        <span className="text-[11px] font-semibold" style={{ color: TEAL }}>
                          Discussion flag ON
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500">
                          Discussion flag OFF
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">
          Quandr3 • Ask • Share • Decide
        </div>
      </div>
    </main>
  );
}
