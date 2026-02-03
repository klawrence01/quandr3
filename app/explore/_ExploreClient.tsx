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

      const { data, error } = await supabase
        .from("quandr3s")
        .select(`
          id,
          title,
          context,
          category,
          status,
          city,
          state,
          hero_image_url,
          created_at,
          closes_at,
          voting_duration_hours,
          discussion_open
        `)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        setRows(data || []);
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

    if (status !== "all") {
      list = list.filter((r) => r.status === status);
    }

    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((r) => {
        return (
          (r.title || "").toLowerCase().includes(needle) ||
          (r.context || "").toLowerCase().includes(needle) ||
          (r.city || "").toLowerCase().includes(needle) ||
          (r.state || "").toLowerCase().includes(needle)
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
