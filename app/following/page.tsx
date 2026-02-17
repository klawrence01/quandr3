"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand
========================= */
const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

/* =========================
   Helpers
========================= */
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

function fmtDate(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function FollowingFeedPage() {
  const [viewerId, setViewerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [errMsg, setErrMsg] = useState("");

  const hasFollows = useMemo(() => (followedIds || []).length > 0, [followedIds]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setViewerId(data?.user?.id || "");
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!viewerId) {
      setLoading(false);
      return;
    }

    let alive = true;

    async function load() {
      setLoading(true);
      setErrMsg("");

      // 1) who do I follow?
      const relRes = await supabase
        .from("follows")
        .select("followed_id, created_at")
        .eq("follower_id", viewerId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (relRes?.error) {
        if (!alive) return;
        setErrMsg(relRes.error.message || "Could not load follows.");
        setFollowedIds([]);
        setRows([]);
        setLoading(false);
        return;
      }

      const ids = (relRes?.data || []).map((r: any) => r.followed_id).filter(Boolean);
      if (!alive) return;
      setFollowedIds(ids);

      if (!ids.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) get recent Quandr3s by those people
      const qRes = await supabase
        .from("quandr3s")
        .select("id, title, status, created_at, author_id")
        .in("author_id", ids)
        .order("created_at", { ascending: false })
        .limit(60);

      if (qRes?.error) {
        if (!alive) return;
        setErrMsg(qRes.error.message || "Could not load feed posts.");
        setRows([]);
        setLoading(false);
        return;
      }

      const feed = qRes?.data || [];
      const authorIds = Array.from(new Set(feed.map((q: any) => q.author_id).filter(Boolean)));

      // 3) map author display names (optional nice-to-have)
      let nameMap: Record<string, any> = {};
      if (authorIds.length) {
        const pRes = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", authorIds);

        (pRes?.data || []).forEach((p: any) => {
          nameMap[p.id] = p;
        });
      }

      const merged = feed.map((q: any) => ({
        ...q,
        author_name: safeStr(nameMap[q.author_id]?.display_name) || `Curioso ${shortId(q.author_id)}`,
        author_avatar: nameMap[q.author_id]?.avatar_url || "",
      }));

      if (!alive) return;
      setRows(merged);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [viewerId]);

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
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
                Following Feed
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                /following
              </div>
            </div>
          </Link>

          <Link
            href="/q/create"
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm"
            style={{ background: BLUE }}
          >
            Create a Quandr3
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">FEED</div>
          <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
            Posts from people you follow
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {viewerId
              ? loading
                ? "Loading…"
                : hasFollows
                ? "Newest Quandr3s first."
                : "You aren’t following anyone yet."
              : "Log in to see your feed."}
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border bg-white p-4 text-sm font-bold text-rose-600">
              {errMsg}
            </div>
          ) : null}

          {!loading && viewerId && hasFollows && !rows.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-700">
              No posts yet from the people you follow.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(rows || []).map((q: any) => (
              <div
                key={q.id}
                className="rounded-[26px] border bg-white p-4 shadow-sm transition hover:shadow-md"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/u/${q.author_id}`} className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border bg-slate-50 text-sm font-extrabold"
                      style={{ borderColor: "rgba(15,23,42,0.12)", color: NAVY }}
                      title="Author"
                    >
                      {q.author_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.author_avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold" style={{ color: NAVY }}>
                        {safeStr(q.author_name)}
                      </div>
                      <div className="text-[11px] text-slate-500">{fmtDate(q.created_at)}</div>
                    </div>
                  </Link>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{
                      background: "rgba(30,99,243,0.10)",
                      color: BLUE,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {safeStr(q.status || "open")}
                  </span>
                </div>

                <Link href={`/q/${q.id}`} className="mt-3 block">
                  <div className="text-base font-extrabold" style={{ color: NAVY }}>
                    {safeStr(q.title) || "Untitled Quandr3"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Tap to view & vote.</div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
