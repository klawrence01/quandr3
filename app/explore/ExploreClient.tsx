"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 250;
const EXPLAINER_VIDEO_URL = "https://youtu.be/N8JhimbnRVg?si=_24H0PN25opiWtUI";

function safeStr(x: any) {
  return (x ?? "").toString();
}

function hoursLeft(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function effectiveStatus(row: any) {
  const s = (row?.status || "").toLowerCase();
  if (s === "open") {
    const h = hoursLeft(row?.closes_at);
    if (h !== null && h <= 0) return "awaiting_user";
  }
  return s || "unknown";
}

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [meId, setMeId] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id || "";
      setMeId(uid);

      const { data, error } = await supabase
        .from("quandr3s")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(SAFE_LIMIT);

      if (error) throw error;

      setRows(data || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load Explore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let out = [...rows];

    // SEARCH
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      out = out.filter((r) =>
        `${r.title} ${r.prompt} ${r.category}`.toLowerCase().includes(q)
      );
    }

    // STATUS
    if (statusFilter !== "all") {
      out = out.filter((r) => {
        const s = effectiveStatus(r);

        if (statusFilter === "open") return s === "open";
        if (statusFilter === "closed") return s === "awaiting_user";
        if (statusFilter === "resolved") return s === "resolved";
        if (statusFilter === "mine") return r.author_id === meId;

        return true;
      });
    }

    // CATEGORY
    if (categoryFilter !== "all") {
      out = out.filter(
        (r) => safeStr(r.category).toLowerCase() === categoryFilter
      );
    }

    return out;
  }, [rows, searchQ, statusFilter, categoryFilter, meId]);

  const categories = Array.from(
    new Set(rows.map((r) => safeStr(r.category).toLowerCase()))
  ).filter(Boolean);

  return (
    <>
      {/* VIDEO BLOCK */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">
            Watch the quick explainer.
          </h2>
          <p className="text-slate-600 mb-4">
            See how Quandr3 helps people ask better questions and decide better.
          </p>
          <a
            href={EXPLAINER_VIDEO_URL}
            target="_blank"
            className="block w-full text-center rounded-full bg-blue-600 px-6 py-4 font-bold text-white"
          >
            Watch the Video
          </a>
        </div>
      </section>

      {/* CONTROL STRIP */}
      <section className="mx-auto max-w-6xl px-4 mt-6 space-y-3">

        {/* 🔥 ROW 1 — STATUS */}
        <div className="flex flex-wrap gap-2">
          {["all", "open", "closed", "resolved", "mine"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white border"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 🔥 ROW 2 — CATEGORY */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-2 rounded-full text-sm ${
                categoryFilter === c
                  ? "bg-black text-white"
                  : "bg-white border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 🔍 ROW 3 — SEARCH */}
        <div className="flex justify-end">
          <input
            placeholder="Search..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-[220px] border rounded-full px-4 py-2 text-sm"
          />
        </div>

      </section>

      {/* FEED */}
      <ExploreInner
        loading={loading}
        error={err}
        rows={filtered}
        meId={meId}
      />
    </>
  );
}