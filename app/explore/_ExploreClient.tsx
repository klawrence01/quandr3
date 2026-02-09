// /app/explore/ExploreClient.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 200;

const MS_HOUR = 36e5;
const MS_DAY = 24 * MS_HOUR;
const MS_7D = 7 * MS_DAY;
const MS_30D = 30 * MS_DAY;

function uniq(arr: any[]) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function includesLoose(hay?: string, needle?: string) {
  if (!needle) return true;
  if (!hay) return false;
  return String(hay).toLowerCase().includes(String(needle).toLowerCase());
}

function recencyFactor(createdAt?: string) {
  if (!createdAt) return 1;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(0, ageMs / MS_DAY);
  return 1 / (1 + ageDays / 3);
}

/**
 * ✅ UPDATED: stronger Trending formula (vote velocity matters most)
 * - 24h votes dominate
 * - open posts get a boost
 * - recency matters but less than velocity
 */
function computeTrendScore(r: any, voteStats: any) {
  const v24 = voteStats?.votes_24h || 0;
  const v7 = voteStats?.votes_7d || 0;
  const v30 = voteStats?.votes_30d || 0;

  // HARD bias to velocity so Trending changes even with small vote counts
  const base = v24 * 50 + v7 * 10 + v30 * 2;

  // Open gets extra boost because it's “live”
  const openBoost = r?.status === "open" ? 1.35 : 1.0;

  // Recency still matters but less than velocity
  const rf = recencyFactor(r?.created_at);

  // Keep stable / readable
  return base * openBoost * (0.6 + 0.4 * rf);
}

async function tryLoadVotes(tableName: string, sinceISO: string) {
  // We try common columns: (quandr3_id, created_at) OR (q_id, created_at)
  const r1 = await supabase
    .from(tableName)
    .select("quandr3_id, created_at")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (!r1.error) return { table: tableName, key: "quandr3_id", res: r1 };

  const r2 = await supabase
    .from(tableName)
    .select("q_id, created_at")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (!r2.error) return { table: tableName, key: "q_id", res: r2 };

  return { table: tableName, key: null, res: r2 };
}

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [raw, setRaw] = useState<any[]>([]);
  const [voteMap, setVoteMap] = useState<Record<string, any>>({});
  const [trendInfo, setTrendInfo] = useState<string>("");

  // UI state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("trending"); // trending|new|closing
  const [scope, setScope] = useState("global");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      setTrendInfo("");

      // 1) Load Quandr3s
      const primarySelect =
        "id,title,context,created_at,status,closes_at,category,city,state,media_url,hero_image_url";

      let qData: any[] | null = null;
      let qErr: any = null;

      const r1 = await supabase
        .from("quandr3s")
        .select(primarySelect)
        .order("created_at", { ascending: false })
        .limit(SAFE_LIMIT);

      qData = r1.data;
      qErr = r1.error;

      if (qErr) {
        const r2 = await supabase
          .from("quandr3s")
          .select("id,title,context,created_at,status,closes_at,category,city,state")
          .order("created_at", { ascending: false })
          .limit(SAFE_LIMIT);

        qData = r2.data;
        qErr = r2.error;
      }

      if (ignore) return;

      if (qErr) {
        setErr(qErr.message || "Failed to load explore feed.");
        setRaw([]);
        setVoteMap({});
        setLoading(false);
        return;
      }

      const quandr3s = qData || [];
      setRaw(quandr3s);

      // 2) Load recent votes for Trending (auto-detect table/column)
      const since30dISO = new Date(Date.now() - MS_30D).toISOString();

      const tableCandidates = ["quandr3_votes", "votes", "quandr3_votes_view"];
      let picked: any = null;

      for (const t of tableCandidates) {
        const attempt = await tryLoadVotes(t, since30dISO);
        if (!attempt?.res?.error) {
          picked = attempt;
          break;
        }
      }

      const map: Record<string, any> = {};

      if (!picked) {
        setTrendInfo(
          "Trending: vote table not readable (RLS or name mismatch). Trending will use fallback ordering."
        );
      } else {
        const votes = picked?.res?.data || [];
        const idKey = picked?.key;

        setTrendInfo(`Trending source: ${picked.table}.${idKey}`);

        const now = Date.now();
        for (const v of votes) {
          const id = v?.[idKey];
          const ts = v?.created_at ? new Date(v.created_at).getTime() : null;
          if (!id || !ts) continue;

          if (!map[id]) map[id] = { votes_24h: 0, votes_7d: 0, votes_30d: 0, trendScore: 0 };

          const age = now - ts;
          if (age <= MS_DAY) map[id].votes_24h += 1;
          if (age <= MS_7D) map[id].votes_7d += 1;
          if (age <= MS_30D) map[id].votes_30d += 1;
        }
      }

      // 3) Compute trendScore for each post
      for (const r of quandr3s) {
        const id = r?.id;
        const stats = map[id] || { votes_24h: 0, votes_7d: 0, votes_30d: 0, trendScore: 0 };
        stats.trendScore = computeTrendScore(r, stats);
        map[id] = stats;
      }

      setVoteMap(map);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = uniq(
      (raw || [])
        .map((r: any) => r?.category)
        .filter((c: any) => typeof c === "string" && c.trim().length > 0)
        .map((c: string) => c.trim())
    );
    return ["all", ...cats];
  }, [raw]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join("|")]);

  const rows = useMemo(() => {
    let out = [...(raw || [])];

    if (scope === "local") {
      out = out.filter(
        (r: any) => (r?.city && String(r.city).trim()) || (r?.state && String(r.state).trim())
      );
    }

    if (status && status !== "all") {
      out = out.filter((r: any) => r?.status === status);
    }

    if (activeCategory && activeCategory !== "all") {
      out = out.filter((r: any) => String(r?.category || "").trim() === activeCategory);
    }

    const needle = (q || "").trim();
    if (needle) {
      out = out.filter((r: any) => {
        return (
          includesLoose(r?.title, needle) ||
          includesLoose(r?.context, needle) ||
          includesLoose(r?.city, needle) ||
          includesLoose(r?.state, needle) ||
          includesLoose(r?.id, needle)
        );
      });
    }

    // ✅ helper for “fallback trending” when votes are flat
    function fallbackTrendingSort(a: any, b: any) {
      const aOpen = a?.status === "open";
      const bOpen = b?.status === "open";
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      const aT = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bT - aT;
    }

    if (sort === "closing") {
      out.sort((a: any, b: any) => {
        const aOpen = a?.status === "open";
        const bOpen = b?.status === "open";
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;

        const aT = a?.closes_at ? new Date(a.closes_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bT = b?.closes_at ? new Date(b.closes_at).getTime() : Number.MAX_SAFE_INTEGER;
        return aT - bT;
      });
    } else if (sort === "trending") {
      // ✅ Determine if trending is “flat” (all scores are 0)
      const anyTrending = out.some((r: any) => (voteMap?.[r?.id]?.trendScore || 0) > 0);

      if (!anyTrending) {
        // Fallback so Trending ALWAYS changes visibly
        out.sort(fallbackTrendingSort);
      } else {
        out.sort((a: any, b: any) => {
          const aS = voteMap?.[a?.id]?.trendScore || 0;
          const bS = voteMap?.[b?.id]?.trendScore || 0;
          if (bS !== aS) return bS - aS;

          // tie-breaker: open first, then newest
          return fallbackTrendingSort(a, b);
        });
      }
    } else {
      out.sort((a: any, b: any) => {
        const aT = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });
    }

    return out.map((r: any) => ({
      ...r,
      _votes24h: voteMap?.[r?.id]?.votes_24h || 0,
      _votes7d: voteMap?.[r?.id]?.votes_7d || 0,
      _votes30d: voteMap?.[r?.id]?.votes_30d || 0,
      _trendScore: voteMap?.[r?.id]?.trendScore || 0,
    }));
  }, [raw, q, status, sort, scope, activeCategory, voteMap]);

  return (
    <ExploreInner
      loading={loading}
      err={err || trendInfo}
      rows={rows || []}
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      sort={sort}
      setSort={setSort}
      scope={scope}
      setScope={setScope}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      categories={categories}
    />
  );
}
