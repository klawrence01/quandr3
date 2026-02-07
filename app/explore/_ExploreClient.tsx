"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 200;

function uniq(arr: any[]) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function includesLoose(hay?: string, needle?: string) {
  if (!needle) return true;
  if (!hay) return false;
  return String(hay).toLowerCase().includes(String(needle).toLowerCase());
}

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [raw, setRaw] = useState<any[]>([]);

  // UI state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all|open|awaiting_user|resolved
  const [sort, setSort] = useState("new"); // new|closing
  const [scope, setScope] = useState("global"); // global|local
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");

      // NOTE: we select a superset safely; if your table doesn't have a column,
      // supabase will error. So we do a 2-step fallback.
      const primarySelect =
        "id,title,context,created_at,status,closes_at,category,city,state,media_url,hero_image_url";

      let data: any[] | null = null;
      let error: any = null;

      // Try full select
      const r1 = await supabase
        .from("quandr3s")
        .select(primarySelect)
        .order("created_at", { ascending: false })
        .limit(SAFE_LIMIT);

      data = r1.data;
      error = r1.error;

      // Fallback if your schema doesn't include some optional cols
      if (error) {
        const r2 = await supabase
          .from("quandr3s")
          .select("id,title,created_at,status,closes_at")
          .order("created_at", { ascending: false })
          .limit(SAFE_LIMIT);

        data = r2.data;
        error = r2.error;
      }

      if (ignore) return;

      if (error) {
        setErr(error.message || "Failed to load explore feed.");
        setRaw([]);
        setLoading(false);
        return;
      }

      setRaw(data || []);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Categories (pill row)
  const categories = useMemo(() => {
    const cats = uniq(
      (raw || [])
        .map((r: any) => r?.category)
        .filter((c: any) => typeof c === "string" && c.trim().length > 0)
        .map((c: string) => c.trim())
    );

    return ["all", ...cats];
  }, [raw]);

  // If current activeCategory disappears (after refresh), snap back to "all"
  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join("|")]);

  // Apply scope/status/category/search + sort
  const rows = useMemo(() => {
    let out = [...(raw || [])];

    // Scope
    if (scope === "local") {
      out = out.filter((r: any) => (r?.city && String(r.city).trim()) || (r?.state && String(r.state).trim()));
    }

    // Status
    if (status && status !== "all") {
      out = out.filter((r: any) => r?.status === status);
    }

    // Category
    if (activeCategory && activeCategory !== "all") {
      out = out.filter((r: any) => String(r?.category || "").trim() === activeCategory);
    }

    // Search (title/context/city/state/id)
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
        // Closing soon makes sense mainly for open items; keep others after
        const aOpen = a?.status === "open";
        const bOpen = b?.status === "open";
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;

        const aT = a?.closes_at ? new Date(a.closes_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bT = b?.closes_at ? new Date(b.closes_at).getTime() : Number.MAX_SAFE_INTEGER;
        return aT - bT;
      });
    } else {
      out.sort((a: any, b: any) => {
        const aT = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });
    }

    return out;
  }, [raw, q, status, sort, scope, activeCategory]);

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
