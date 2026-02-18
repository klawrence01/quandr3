// /app/explore/ExploreClient.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

const SAFE_LIMIT = 250;

/* =========================
   Brand
========================= */
const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function uniq(arr: any[]) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function safeStr(x: any) {
  return (x ?? "").toString();
}

/* =========================
   ✅ location parser
   Expects: "City, County, ST" (or any subset)
========================= */
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

/* =========================
   ✅ time-aware status helpers
========================= */

function hoursLeft(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

/**
 * ✅ UI-only effective status:
 * If status is "open" but closes_at already passed, treat as "awaiting_user"
 */
function effectiveStatus(row: any) {
  const s = (row?.status || "").toLowerCase();
  if (s === "open") {
    const h = hoursLeft(row?.closes_at);
    if (h !== null && h <= 0) return "awaiting_user";
  }
  return s || "unknown";
}

/**
 * ✅ Used ONLY for the status filter buttons (all/open/closed/resolved)
 */
function normStatusForFilter(row: any) {
  const s = effectiveStatus(row);
  if (s === "open") return "open";
  if (s === "awaiting_user") return "closed";
  if (s === "resolved") return "resolved";
  return "other";
}

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");

  // viewer profile (for Local toggle)
  const [meId, setMeId] = useState("");
  const [meCity, setMeCity] = useState("");
  const [meState, setMeState] = useState("");
  const [meRegion, setMeRegion] = useState("");

  // UI filters
  const [scope, setScope] = useState<"global" | "local">("global");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // ✅ PWA Install
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installReady, setInstallReady] = useState(false);

  // ✅ avoid rapid double-refresh storms
  const lastReloadRef = useRef<number>(0);
  function shouldReloadNow() {
    const now = Date.now();
    if (now - lastReloadRef.current < 800) return false;
    lastReloadRef.current = now;
    return true;
  }

  useEffect(() => {
    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallReady(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
        setInstallReady(false);
        return;
      } catch {}
    }
    alert(
      "Install Quandr3:\n\n" +
        "• iPhone/iPad (Safari): Share → Add to Home Screen\n" +
        "• Android (Chrome): ⋮ → Install app / Add to Home screen\n" +
        "• Desktop (Chrome/Edge): Install in address bar or browser menu"
    );
  }

  // load auth + profile
  async function loadMe() {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ? String(data.user.id) : "";
      setMeId(uid);

      if (!uid) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("location,city,state")
        .eq("id", uid)
        .maybeSingle();

      const parsed = parseLocation(prof?.location);

      const city = safeStr(parsed.city || prof?.city).trim();
      const state = safeStr(parsed.state || prof?.state).trim();
      const region = safeStr(parsed.region).trim();

      setMeCity(city);
      setMeState(state);
      setMeRegion(region);
    } catch {
      // ok
    }
  }

  async function load(reason = "load") {
    setLoading(true);
    setErr("");

    try {
      await loadMe();

      // ✅ QUEUE QUERY: show only released posts (published_at <= now) OR legacy rows (published_at is null)
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("quandr3s")
        .select("id,title,prompt,category,status,created_at,closes_at,city,region,state,author_id,published_at")
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

  // Initial load
  useEffect(() => {
    load("mount");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Refresh when returning to tab / window
  useEffect(() => {
    function onFocus() {
      if (!shouldReloadNow()) return;
      load("focus");
    }
    function onVis() {
      if (document.visibilityState === "visible") {
        if (!shouldReloadNow()) return;
        load("visible");
      }
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Refresh when Create/Resolve sets localStorage flag
  useEffect(() => {
    function tick() {
      try {
        const v = localStorage.getItem("quandr3_explore_refresh") || "";
        if (!v) return;

        if ((tick as any)._last !== v) {
          (tick as any)._last = v;
          if (!shouldReloadNow()) return;
          load("storage-flag");
        }
      } catch {}
    }

    tick();
    const t = setInterval(tick, 800);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Realtime: refresh on INSERT to quandr3s
  useEffect(() => {
    const channel = supabase
      .channel("quandr3s-explore-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quandr3s" }, () => {
        if (!shouldReloadNow()) return;
        load("realtime-insert");
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const cats = uniq((rows || []).map((r) => safeStr(r?.category).trim()).filter(Boolean));
    return ["all", ...cats.sort((a: string, b: string) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    let out = [...(rows || [])];

    // ✅ Local/Global: City-first, County/Region fallback
    if (scope === "local") {
      const mc = safeStr(meCity).trim().toLowerCase();
      const mr = safeStr(meRegion).trim().toLowerCase();
      const ms = safeStr(meState).trim().toLowerCase();

      if (mc || mr || ms) {
        out = out.filter((r) => {
          const rc = safeStr(r?.city).trim().toLowerCase();
          const rr = safeStr(r?.region).trim().toLowerCase();
          const rs = safeStr(r?.state).trim().toLowerCase();

          if (mc && rc && rc === mc) return true;
          if (mr && rr && rr === mr) return true;
          if (!mc && !mr && ms && rs && rs === ms) return true;

          return false;
        });
      }
    }

    // ✅ Status filter (time-aware)
    if (statusFilter !== "all") {
      out = out.filter((r) => normStatusForFilter(r) === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      out = out.filter((r) => safeStr(r?.category).trim() === categoryFilter);
    }

    // Search
    const q = searchQ.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const blob = [
          r?.title,
          r?.prompt,
          r?.category,
          r?.city,
          r?.region,
          r?.state,
          r?.status,
          effectiveStatus(r),
          r?.author_id,
        ]
          .map((x) => safeStr(x).toLowerCase())
          .join(" ");
        return blob.includes(q);
      });
    }

    return out;
  }, [rows, scope, statusFilter, categoryFilter, searchQ, meCity, meRegion, meState]);

  return (
    <div>
      {/* Utility bar */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => load("manual")}
            className="rounded-full border bg-white px-4 py-2 text-xs font-extrabold hover:bg-slate-50"
            style={{ color: NAVY }}
            title="Refresh Explore"
          >
            Refresh
          </button>

          <Link
            href="/blog"
            className="rounded-full border bg-white px-4 py-2 text-xs font-extrabold hover:bg-slate-50"
            style={{ color: NAVY }}
          >
            Blog
          </Link>

          <button
            type="button"
            onClick={handleInstall}
            className="rounded-full px-4 py-2 text-xs font-extrabold text-white hover:opacity-95"
            style={{ background: installReady ? BLUE : NAVY }}
            title={installReady ? "Install Quandr3" : "Add Quandr3 to your home screen"}
          >
            {installReady ? "Install App" : "Add to Home Screen"}
          </button>
        </div>
      </div>

      <ExploreInner
        loading={loading}
        error={err}
        rows={filtered}
        rawRows={rows}
        meId={meId}
        meCity={meCity}
        meState={meState}
        scope={scope}
        setScope={setScope}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
      />
    </div>
  );
}
