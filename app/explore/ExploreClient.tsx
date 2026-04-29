"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 250;

const EXPLAINER_VIDEO_URL = "https://youtu.be/N8JhimbnRVg?si=_24H0PN25opiWtUI";

function safeStr(x: any) {
  return (x ?? "").toString();
}

function parseLocation(loc?: string) {
  const parts = safeStr(loc)
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  return {
    city: parts[0] || "",
    region: parts[1] || "",
    state: parts[2] || "",
    country: parts[3] || "",
  };
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
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");

  const [meId, setMeId] = useState("");
  const [meCity, setMeCity] = useState("");
  const [meState, setMeState] = useState("");
  const [meRegion, setMeRegion] = useState("");

  const [scope, setScope] = useState<"global" | "local">("global");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "closed" | "resolved" | "following" | "mine"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");

  const lastReloadRef = useRef<number>(0);

  function shouldReloadNow() {
    const now = Date.now();
    if (now - lastReloadRef.current < 800) return false;
    lastReloadRef.current = now;
    return true;
  }

  async function loadMe(): Promise<string> {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ? String(data.user.id) : "";
      setMeId(uid);

      if (!uid) return "";

      const { data: prof } = await supabase
        .from("profiles")
        .select("location,city,state")
        .eq("id", uid)
        .maybeSingle();

      const parsed = parseLocation(prof?.location);

      setMeCity(parsed.city || prof?.city || "");
      setMeState(parsed.state || prof?.state || "");
      setMeRegion(parsed.region || "");

      return uid;
    } catch {
      return "";
    }
  }

  async function load(reason = "load") {
    setLoading(true);
    setErr("");

    try {
      await loadMe();

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("quandr3s")
        .select(`
          id,
          title,
          prompt,
          category,
          status,
          created_at,
          closes_at,
          city,
          region,
          state,
          author_id,
          is_anonymous,
          published_at,
          profiles:author_id (
            display_name,
            username,
            avatar_url,
            city,
            state
          )
        `)
        .or(`published_at.is.null,published_at.lte.${nowIso}`)
        .order("published_at", { ascending: false })
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

    const q = searchQ.trim().toLowerCase();

    if (q) {
      out = out.filter((r) => {
        const profile = r?.profiles || {};

        const blob = [
          r?.title,
          r?.prompt,
          r?.category,
          r?.city,
          r?.region,
          r?.state,
          r?.status,
          r?.author_id,
          r?.is_anonymous ? "anonymous curioso" : profile?.display_name,
          profile?.username,
        ]
          .map((x) => safeStr(x).toLowerCase())
          .join(" ");

        return blob.includes(q);
      });
    }

    return out;
  }, [rows, searchQ]);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                New to Quandr3?
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Watch the quick explainer.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                See how Quandr3 helps people ask better questions, gather real perspective,
                and make better decisions.
              </p>
            </div>

            <a
              href={EXPLAINER_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Watch the Video
            </a>
          </div>
        </div>
      </section>

      <ExploreInner
        loading={loading}
        error={err}
        rows={filtered}
        rawRows={rows}
        meId={meId}
        scope={scope}
        setScope={setScope}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
      />
    </>
  );
}