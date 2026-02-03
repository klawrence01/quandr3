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
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");

      const { data, error } = await supabase
        .from("quandr3s")
        .select(
          "id,title,question,status,created_at,created_by,voting_duration_hours,voting_max_votes,discussion_open"
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (!alive) return;

      if (error) {
        setErr(error.message || "Failed to load Explore.");
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
        const t = (r.title || "").toLowerCase();
        const qu = (r.question || "").toLowerCase();
        return t.includes(needle) || qu.includes(needle) || String(r.id).includes(needle);
      });
    }

    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "new" ? tb - ta : ta - tb;
    });

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
