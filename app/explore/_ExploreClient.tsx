"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 200;

// vote lookback windows
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Simple recency factor: newer posts get a boost, older ones decay
function recencyFactor(createdAt?: string) {
  if (!createdAt) return 1;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(0, ageMs / MS_DAY);
  // 0 days => ~1.0, 3 days => ~0.5, 9 days => ~0.25 (soft decay)
  return 1 / (1 + ageDays / 3);
}

// Trend score combines velocity + total interest + recency boost
function computeTrendScore(r: any, voteStats: any) {
  const v24 = voteStats?.votes_24h || 0;
  const v7 = voteStats?.votes_7d || 0;
  const v30 = voteStats?.votes_30d || 0;

  // Weighting: 24h velocity matters most
  const base = v24 * 5 + v7 * 2 + v30 * 1;

  // Boost open slightly (people can still influence)
  const openBoost = r?.status === "open" ? 1.15 : 1.0;

  // Soft cap to avoid one monster post dominating forever
  const capped = Math.sqrt(base) * 10;

  return capped * openBoost * recencyFactor(r?.created_at);
}

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [raw, setRaw] = useState<any[]>([]);
  const [voteMap, setVoteMap] = useState<Record<string, any>>({}); // {quandr3_id: {votes_24h, votes_7d, votes_30d, trendScore}}

  // UI state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all|open|awaiting_user|resolved
  const [sort, setSort] = useState("trending"); // trending|new|closing
  const [scope, setScope] = useState("global"); // global|local
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");

      // 1) Load Quandr3s (safe fallback select)
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
          .select("id,title,created_at,status,closes_at,category,city,state")
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

      // 2) Load recent votes (to compute Trending)
      // We’ll compute vote velocity client-side to avoid GROUP BY/RPC for now.
      const since30dISO = new Date(Date.now() - MS_30D).toISOString();

      const vRes = await supabase
        .from("quandr3_votes")
        .select("quandr3_id, created_at")
        .gte("created_at", since30dISO)
        .order("created_at", { ascending: false })
        .limit(5000);

      // If votes table doesn’t exist or RLS blocks it, Trending will fall back gracefully.
      const votes = vRes?.data || [];
      const vErr = vRes?.error;

      // Build stats map
      const map: Record<string, any> = {};

      if (!vErr && votes.length) {
        const now = Date.now();
        for (const v of votes) {
          const id = v?.quandr3_id;
          const ts = v?.created_at ? new Date(v.created_at).getTime() : null;
          if (!id || !ts) continue;

          if (!map[id]) map[id] = { votes_24h: 0, votes_7d: 0, votes_30d: 0, trendScore: 0 };

          const age = now - ts;
          if (age <= MS_DAY) map[id].votes_24h += 1;
          if (age <= MS_7D) map[id].votes_7d += 1;
          if (age <= MS_30D) map[id].votes_30d += 1;
        }
      }

      // Compute trendScore for each post
      for (const r of quandr3s) {
        const id = r?.id;
        const stats = map[id] || { votes_24h: 0, votes_7d: 0, votes_30d: 0, trendScore: 0 };
        stats.trendScore = computeTrendScore(r, stats);
        map[id] = stats;
      }

      setVoteMap(map);

      // Optional: if votes table is blocked, show a soft warning only in console
      if (vErr) {
        // eslint-disable-next-line no-console
        console.warn("Trending: could not read quandr3_votes:", vErr?.message);
      }

      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Categories
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

  // Apply scope/status/category/search + sorting (incl trending)
  const rows = useMemo(() => {
    let out = [...(raw || [])];

    // Scope
    if (scope === "local") {
      out = out.filter(
        (r: any) =>
          (r?.city && String(r.city).trim()) || (r?.state && String(r.state).trim())
      );
    }

    // Status
    if (status && status !== "all") {
      out = out.filter((r: any) => r?.status === status);
    }

    // Category
    if (activeCategory && activeCategory !== "all") {
      out = out.filter((r: any) => String(r?.category || "").trim() === activeCategory);
    }

    // Search
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

    // Sort
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
      out.sort((a: any, b: any) => {
        const aS = voteMap?.[a?.id]?.trendScore || 0;
        const bS = voteMap?.[b?.id]?.trendScore || 0;
        // tie-breaker: newest
        if (bS !== aS) return bS - aS;

        const aT = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });
    } else {
      out.sort((a: any, b: any) => {
        const aT = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });
    }

    // Attach vote stats so Inner can show later if you want (optional)
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
      err={err}
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
