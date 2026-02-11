// app/u/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand
========================= */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const TABS = [
  { key: "latest", label: "Latest Posts" },
  { key: "top", label: "Top Picks" },
  { key: "about", label: "About" },
];

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

/* =========================
   Stable fallbacks
========================= */

function fallbackProfile(userId: string) {
  const name = userId?.length ? `Curioso ${shortId(userId)}` : "Curioso";
  return {
    id: userId,
    display_name: name,
    what_i_know:
      "Add a short paragraph here about your background, context, and lenses. (This will come from the Profile → “What I Know” section.)",
    avatar_url: "",
    city: "",
    state: "",
  };
}

function fallbackLatestPosts() {
  return [
    {
      id: "demo-1",
      title: "Vegas weekend wardrobe — help me get it right?",
      category: "Style",
      status: "resolved",
      votes: 18,
      created_at: "2026-01-15T06:00:00.000Z",
      hero: "/quandr3/placeholders/default.jpg",
    },
    {
      id: "demo-2",
      title: "Should I take the new role or stay where I am?",
      category: "Career",
      status: "open",
      votes: 7,
      created_at: "2026-01-20T14:10:00.000Z",
      hero: "/quandr3/placeholders/career.jpg",
    },
    {
      id: "demo-3",
      title: "Do I pay down debt first or invest first?",
      category: "Money",
      status: "awaiting_user",
      votes: 31,
      created_at: "2026-01-28T19:02:00.000Z",
      hero: "/quandr3/placeholders/money.jpg",
    },
  ];
}

function fallbackTopPicks() {
  return [
    {
      id: "pick-1",
      title: "Best way to level up my daily discipline?",
      category: "Lifestyle",
      status: "resolved",
      votes: 102,
      hero: "/quandr3/placeholders/default.jpg",
    },
    {
      id: "pick-2",
      title: "Move to a new city now or wait 6 months?",
      category: "Career",
      status: "resolved",
      votes: 88,
      hero: "/quandr3/placeholders/career.jpg",
    },
  ];
}

function statusPill(status?: string) {
  const s = safeStr(status).toLowerCase();
  if (s === "open") return { label: "Open", bg: "rgba(30,99,243,0.12)", fg: BLUE };
  if (s === "awaiting_user")
    return { label: "Closed (Awaiting Curioso)", bg: "rgba(255,107,107,0.12)", fg: CORAL };
  return { label: "Resolved", bg: "rgba(0,169,165,0.12)", fg: TEAL };
}

function pickHeroFromRow(row: any) {
  const hero =
    row?.hero ||
    row?.hero_url ||
    row?.banner_url ||
    row?.thumbnail_url ||
    row?.cover_url ||
    "";
  return safeStr(hero) || "/quandr3/placeholders/default.jpg";
}

/* =========================
   Page
========================= */

export default function UserProfilePage() {
  const params = useParams();

  const userId = useMemo(() => {
    const raw: any = (params as any)?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [tab, setTab] = useState<"latest" | "top" | "about">("latest");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(fallbackProfile(userId));
  const [latest, setLatest] = useState<any[]>(fallbackLatestPosts());
  const [topPicks, setTopPicks] = useState<any[]>(fallbackTopPicks());
  const [stats, setStats] = useState<any>({
    posts: 0,
    votesGiven: 0,
    followers: 0,
    following: 0,
  });

  useEffect(() => {
    if (!userId) return;

    let alive = true;

    async function load() {
      setLoading(true);

      // Profile
      const profRes = await supabase
        .from("profiles")
        .select("id, display_name, what_i_know, avatar_url, city, state")
        .eq("id", userId)
        .maybeSingle();

      // Posts by author_id (if your schema uses user_id or created_by, swap here)
      const postsRes = await supabase
        .from("quandr3s")
        .select("id, title, status, created_at, category, hero, hero_url, banner_url, thumbnail_url, cover_url")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      // Vote counts for those posts (optional)
      let voteCountMap: Record<string, number> = {};
      if (postsRes?.data?.length) {
        const ids = postsRes.data.map((r: any) => r.id).filter(Boolean);
        const votesRes = await supabase.from("votes").select("quandr3_id").in("quandr3_id", ids);

        (votesRes?.data || []).forEach((v: any) => {
          const k = v?.quandr3_id;
          if (!k) return;
          voteCountMap[k] = (voteCountMap[k] || 0) + 1;
        });
      }

      // Votes given by this user (if your votes table uses a different column, swap here)
      const votesGivenRes = await supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("voter_id", userId);

      const nextProfile = profRes?.data ? { ...fallbackProfile(userId), ...profRes.data } : fallbackProfile(userId);

      const nextLatest =
        postsRes?.data?.length
          ? postsRes.data.map((r: any) => ({
              id: r.id,
              title: safeStr(r.title),
              category: safeStr(r.category) || "Quandr3",
              status: safeStr(r.status) || "open",
              votes: voteCountMap[r.id] || 0,
              created_at: r.created_at,
              hero: pickHeroFromRow(r),
            }))
          : fallbackLatestPosts();

      const nextTop = fallbackTopPicks();

      const nextStats = {
        posts: nextLatest?.filter((x: any) => x?.id && !String(x.id).startsWith("demo-")).length || nextLatest.length,
        votesGiven: votesGivenRes?.count || 0,
        followers: 0,
        following: 0,
      };

      if (!alive) return;

      setProfile(nextProfile);
      setLatest(nextLatest);
      setTopPicks(nextTop);
      setStats(nextStats);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/explore" className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
            >
              <span className="text-lg" style={{ color: NAVY }}>
                ←
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Profile
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                /u/{shortId(userId)}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/q/create"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create a Quandr3
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Profile header card */}
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 text-xl font-extrabold"
                style={{ borderColor: "rgba(15,23,42,0.12)", color: NAVY }}
                title="Avatar"
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  "?"
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>
                    {safeStr(profile.display_name) || "Curioso"}
                  </h1>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: "rgba(30,99,243,0.10)", color: BLUE }}
                  >
                    Public Profile
                  </span>

                  {loading ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-extrabold"
                      style={{ background: "rgba(15,23,42,0.06)", color: NAVY }}
                    >
                      Loading…
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold" style={{ color: NAVY }}>
                    What I Know:
                  </span>{" "}
                  {safeStr(profile.what_i_know)}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  User ID: <span className="font-mono">{safeStr(userId)}</span>
                </div>
              </div>
            </div>

            {/* Follow controls (disabled for now) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-full px-5 py-2 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
                style={{ background: TEAL }}
                disabled
              >
                Follow
              </button>

              <button
                className="rounded-full border bg-white px-5 py-2 text-sm font-extrabold text-slate-800"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
                disabled
              >
                Followers
              </button>

              <button
                className="rounded-full border bg-white px-5 py-2 text-sm font-extrabold text-slate-800"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
                disabled
              >
                Following
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-600">POSTS</div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                {stats.posts}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-600">VOTES GIVEN</div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                {stats.votesGiven}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-600">FOLLOWERS</div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                {stats.followers}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-600">FOLLOWING</div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                {stats.following}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className="rounded-full px-4 py-2 text-sm font-extrabold"
                  style={{
                    background: active ? "rgba(30,99,243,0.12)" : "rgba(15,23,42,0.04)",
                    color: active ? BLUE : NAVY,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Latest */}
        {tab === "latest" ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-widest text-slate-600">LATEST</div>
                <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                  Recent Quandr3s
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {latest.map((q) => {
                const pill = statusPill(q.status);
                return (
                  <Link
                    key={q.id}
                    href={`/q/${q.id}`}
                    className="group overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:shadow-md"
                    style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  >
                    <div className="relative h-[130px] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.hero} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2343cc] via-[#0b234388] to-[#0b234320]" />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                          {safeStr(q.category)}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: pill.bg, color: pill.fg }}>
                          {pill.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-lg font-extrabold leading-snug" style={{ color: NAVY }}>
                        {safeStr(q.title)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-50 px-3 py-1 font-extrabold" style={{ color: NAVY }}>
                          {q.votes} vote{q.votes === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 font-extrabold" style={{ color: NAVY }}>
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Top Picks */}
        {tab === "top" ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">TOP PICKS</div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                Curioso’s Top Picks
              </div>
              <div className="mt-1 text-sm text-slate-600">Still mocked until we add a picks table.</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {topPicks.map((q) => {
                const pill = statusPill(q.status);
                return (
                  <Link
                    key={q.id}
                    href={`/q/${q.id}`}
                    className="group flex gap-4 overflow-hidden rounded-[26px] border bg-white p-4 shadow-sm transition hover:shadow-md"
                    style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.hero} alt="" className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                          {safeStr(q.category)}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: pill.bg, color: pill.fg }}>
                          {pill.label}
                        </span>
                      </div>
                      <div className="mt-2 truncate text-base font-extrabold" style={{ color: NAVY }}>
                        {safeStr(q.title)}
                      </div>
                      <div className="mt-2 text-xs text-slate-600">{q.votes} votes</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* About */}
        {tab === "about" ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">ABOUT</div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                What I Know
              </div>
              <div className="mt-1 text-sm text-slate-600">This is the public-facing profile context section.</div>
            </div>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-5">
              <div className="whitespace-pre-wrap text-sm text-slate-800">{safeStr(profile.what_i_know)}</div>
            </div>
          </section>
        ) : null}

        <div className="mt-10 pb-10 text-center text-xs text-slate-500">Quandr3 • Ask • Share • Decide</div>
      </div>
    </main>
  );
}
