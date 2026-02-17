// /app/explore/_ExploreInner.tsx
"use client";
// @ts-nocheck

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function hoursLeft(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

/**
 * ✅ A) Effective status for Explore UI
 * - If status=open but closes_at is in the past (or missing), treat as closed for badge + ordering.
 * - awaiting_user is "closed" in UI.
 */
function effectiveStatus(row: any) {
  const raw = (row?.status || "").toLowerCase();

  // already closed/resolved by backend state
  if (raw === "awaiting_user") return "closed";
  if (raw === "resolved") return "resolved";

  if (raw === "open") {
    const ca = row?.closes_at;
    if (!ca) return "open"; // if you allow open with no closes_at, keep as open
    const end = new Date(ca).getTime();
    if (!isFinite(end)) return "open";
    if (Date.now() >= end) return "closed"; // expired open becomes closed in UI
    return "open";
  }

  return "other";
}

function statusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "open") return { bg: "#e8f3ff", fg: BLUE, label: "open" };
  if (s === "closed") return { bg: "#fff4e6", fg: "#b45309", label: "closed" };
  if (s === "resolved") return { bg: "#ecfdf5", fg: "#059669", label: "resolved" };
  return { bg: "#f1f5f9", fg: "#334155", label: status || "unknown" };
}

function tiny(s?: string, n = 52) {
  const x = (s || "").toString().trim();
  if (!x) return "";
  if (x.length <= n) return x;
  return x.slice(0, n - 1) + "…";
}

async function shareUrl(url: string, title?: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title: title || "Quandr3", url });
      return;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
  } catch {
    try {
      prompt("Copy this link:", url);
    } catch {}
  }
}

function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin || "";
}

export default function ExploreInner(props: any) {
  const router = useRouter();

  const {
    loading,
    error,
    rows,
    rawRows,
    meCity,
    meState,
    scope,
    setScope,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    searchOpen,
    setSearchOpen,
    searchQ,
    setSearchQ,
  } = props;

  // PWA install support
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installReady, setInstallReady] = useState(false);

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
        "• iPhone/iPad (Safari): tap Share → Add to Home Screen\n" +
        "• Android (Chrome): tap ⋮ menu → Install app / Add to Home screen\n" +
        "• Desktop (Chrome/Edge): look for Install in the address bar or browser menu"
    );
  }

  const liveCounts = useMemo(() => {
    const all = rawRows || [];
    const open = all.filter((r: any) => effectiveStatus(r) === "open").length;
    return { open, total: all.length };
  }, [rawRows]);

  const openNow = useMemo(() => {
    const list = (rows || []).filter((r: any) => effectiveStatus(r) === "open");
    return list
      .slice()
      .sort((a: any, b: any) => {
        const ah = hoursLeft(a?.closes_at) ?? 999999;
        const bh = hoursLeft(b?.closes_at) ?? 999999;
        return ah - bh;
      })
      .slice(0, 6);
  }, [rows]);

  const feed = useMemo(() => {
    const list = [...(rows || [])];

    const rank = (row: any) => {
      const s = effectiveStatus(row);
      if (s === "open") return 0;
      if (s === "closed") return 1;
      if (s === "resolved") return 2;
      return 3;
    };

    return list
      .slice()
      .sort((a: any, b: any) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;

        // If both are open, close-soonest first
        if (ra === 0) {
          const ah = hoursLeft(a?.closes_at) ?? 999999;
          const bh = hoursLeft(b?.closes_at) ?? 999999;
          if (ah !== bh) return ah - bh;
        }

        // Otherwise newest first
        return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
      });
  }, [rows]);

  function goToQuandr3(id: string) {
    router.push(`/q/${id}`);
  }

  function buildShareLink(id: string) {
    const origin = getOrigin();
    return origin ? `${origin}/q/${id}` : `/q/${id}`;
  }

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">EXPLORE</div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight" style={{ color: NAVY }}>
              Help someone decide.
            </h1>
            <p className="mt-2 text-slate-700">
              Real people, real dilemmas. Pick A–D and (if you can) add a quick “why.”
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border bg-white px-5 py-4 text-sm shadow-sm">
            <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">LIVE NOW</div>
            <div className="mt-1 font-extrabold" style={{ color: NAVY }}>
              <span className="text-lg">{liveCounts.open}</span> open{" "}
              <span className="text-slate-400">•</span> <span className="text-lg">{liveCounts.total}</span> total
            </div>
          </div>
        </div>

        {/* Control bar */}
        <div className="mt-6 rounded-[24px] border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border">
                <button
                  type="button"
                  onClick={() => setScope("global")}
                  className="px-4 py-2 text-sm font-extrabold"
                  style={{
                    background: scope === "global" ? NAVY : "white",
                    color: scope === "global" ? "white" : NAVY,
                  }}
                >
                  Global
                </button>
                <button
                  type="button"
                  onClick={() => setScope("local")}
                  className="px-4 py-2 text-sm font-extrabold"
                  style={{
                    background: scope === "local" ? NAVY : "white",
                    color: scope === "local" ? "white" : NAVY,
                  }}
                  title={
                    scope === "local"
                      ? `Local: ${meCity || "—"}${meCity && meState ? ", " : ""}${meState || "—"}`
                      : ""
                  }
                >
                  Local
                </button>
              </div>

              <div className="inline-flex flex-wrap gap-2">
                {[
                  ["all", "All"],
                  ["open", "Open"],
                  ["closed", "Closed"],
                  ["resolved", "Resolved"],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setStatusFilter(k)}
                    className="rounded-full border px-4 py-2 text-sm font-extrabold"
                    style={{
                      background: statusFilter === k ? "#eef2ff" : "white",
                      color: NAVY,
                      borderColor: statusFilter === k ? "#c7d2fe" : "#e2e8f0",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border bg-white px-3 py-2">
                <label className="mr-2 text-xs font-extrabold tracking-[0.18em] text-slate-500">CATEGORY</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none"
                  style={{ color: NAVY }}
                >
                  {(categories || ["all"]).map((c: string) => (
                    <option key={c} value={c}>
                      {c === "all" ? "All" : c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                style={{ color: NAVY }}
                aria-label="Search"
                title="Search"
              >
                🔎 Search
              </button>

              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                style={{ color: NAVY }}
                title="Blog"
              >
                📝 Blog
              </Link>

              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                style={{ background: installReady ? BLUE : NAVY }}
                title={installReady ? "Install Quandr3" : "Add to Home Screen"}
              >
                ⬇️ {installReady ? "Install" : "Add"}
              </button>

              <Link
                href="/q/create"
                className="rounded-full px-5 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                style={{ background: BLUE }}
              >
                Create a Quandr3
              </Link>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            {scope === "local" ? (
              <span>
                Showing <span className="font-semibold">Local</span> results
                {meCity || meState ? (
                  <>
                    {" "}
                    for{" "}
                    <span className="font-semibold">
                      {meCity || "—"}
                      {meCity && meState ? ", " : ""}
                      {meState || "—"}
                    </span>
                  </>
                ) : (
                  <> (set your city/state on your profile for best results)</>
                )}
                .
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold">Global</span> results.
              </span>
            )}
          </div>
        </div>

        {/* Search modal */}
        {searchOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-[24px] border bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    Search Quandr3s
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Search title, prompt, category, city/state.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full border bg-white px-3 py-1 text-sm font-extrabold"
                  style={{ color: NAVY }}
                >
                  ✕
                </button>
              </div>

              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                autoFocus
                placeholder="Try: rent, marriage, family, Meriden, Money…"
                className="mt-4 w-full rounded-2xl border p-3 text-sm outline-none"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSearchQ("")}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                  style={{ color: NAVY }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                  style={{ background: NAVY }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Open right now list */}
        <section className="mt-8 rounded-[28px] border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-extrabold" style={{ color: NAVY }}>
              Open right now
            </div>
            <div className="text-sm text-slate-500">Closing soonest first.</div>
          </div>

          {loading ? (
            <div className="mt-4 text-slate-600">Loading…</div>
          ) : error ? (
            <div className="mt-4 text-red-600 font-semibold">{error}</div>
          ) : openNow.length === 0 ? (
            <div className="mt-4 text-slate-600">No open Quandr3s match your filters.</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {openNow.map((r: any) => {
                const badge = statusBadge(effectiveStatus(r));
                const h = hoursLeft(r?.closes_at);
                const url = buildShareLink(r.id);

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => goToQuandr3(r.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: badge.bg, color: badge.fg }}>
                        {badge.label}
                      </span>
                      <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                        {tiny(r?.title, 56)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-slate-500">{h != null ? `${h}h` : "—"}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          shareUrl(url, r?.title || "Quandr3");
                        }}
                        className="rounded-full border px-3 py-1 text-xs font-extrabold hover:bg-slate-50"
                        style={{ color: NAVY }}
                        title="Share"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Feed */}
        <section className="mt-8 grid grid-cols-1 gap-5">
          {feed.map((r: any) => {
            const badge = statusBadge(effectiveStatus(r));
            const h = hoursLeft(r?.closes_at);
            const url = buildShareLink(r.id);

            return (
              <div
                key={r.id}
                className="rounded-[28px] border bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => goToQuandr3(r.id)}
                role="button"
                tabIndex={0}
              >
                <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                  {(r?.category || "QUANDR3").toString().toUpperCase()}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
                    {r?.title}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: badge.bg, color: badge.fg }}>
                      {badge.label}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        shareUrl(url, r?.title || "Quandr3");
                      }}
                      className="rounded-full border px-3 py-1 text-xs font-extrabold hover:bg-slate-50"
                      style={{ color: NAVY }}
                      title="Share"
                    >
                      Share
                    </button>
                  </div>
                </div>

                {/* ✅ prompt */}
                {r?.prompt ? <p className="mt-3 text-slate-700">{tiny(r?.prompt, 170)}</p> : null}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  {r.city || r.state ? (
                    <span className="rounded-full border px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                      {r.city ? r.city : ""}
                      {r.city && r.state ? ", " : ""}
                      {r.state ? r.state : ""}
                    </span>
                  ) : null}

                  <span className="text-slate-400">•</span>
                  <span>
                    <span className="font-semibold">Posted:</span> {fmt(r?.created_at)}
                  </span>

                  {r?.closes_at ? (
                    <>
                      <span className="text-slate-400">•</span>
                      <span>
                        <span className="font-semibold">Closes:</span> {fmt(r?.closes_at)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="inline-flex items-center gap-2">
                        ⏳ <span className="font-semibold">{h ?? 0}</span> hour(s) left
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-10 text-center text-xs text-slate-500">
          Quandr3: <span className="font-semibold">Ask.</span> <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </main>
  );
}
