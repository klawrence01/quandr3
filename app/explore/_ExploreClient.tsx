"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "awaiting_user" | "resolved">("all");
  const [sort, setSort] = useState<"new" | "closing">("new");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");

      // IMPORTANT: we never select "question" from the DB.
      // "question" is a UI field mapped from title.
      const { data, error } = await supabase
        .from("quandr3s")
        .select(`
          id,
          author_id,
          category,
          title,
          context,
          media_url,
          media_type,
          status,
          created_at,
          closes_at,
          voting_duration_hours,
          discussion_open,
          hero_image_url,
          city,
          state,
          region,
          country,
          visibility,
          sponsored_start,
          sponsored_end,
          sponsored_bid,
          sponsored_owner_id
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!alive) return;

      if (error) {
        setErr(error.message || "Couldn’t load Explore.");
        setRows([]);
      } else {
        const normalized = (data || []).map((r: any) => ({
          ...r,
          // ✅ Canonical mapping: UI expects "question"
          question: r.title,
        }));
        setRows(normalized);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];

    if (status !== "all") list = list.filter((r) => r.status === status);

    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const question = (r.question || "").toLowerCase(); // = title
        const context = (r.context || "").toLowerCase();
        const city = (r.city || "").toLowerCase();
        const state = (r.state || "").toLowerCase();
        const id = String(r.id || "");
        return (
          title.includes(needle) ||
          question.includes(needle) ||
          context.includes(needle) ||
          city.includes(needle) ||
          state.includes(needle) ||
          id.includes(needle)
        );
      });
    }

    if (sort === "closing") {
      list.sort((a, b) => new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime());
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [rows, q, status, sort]);

  return (
    <ExploreInner
      loading={loading}
      err={err}
      rows={filtered}
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      sort={sort}
      setSort={setSort}
    />
  );
}
