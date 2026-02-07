// /app/explore/_ExploreInner.tsx
// @ts-nocheck

import Link from "next/link";
import Image from "next/image";

const NAVY = "#0b2343";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

function fmtDateTime(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function hoursLeft(closesAt?: string) {
  if (!closesAt) return 0;
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 36e5));
}

function statusPill(status: string) {
  if (status === "open") return { label: "Open", color: TEAL };
  if (status === "awaiting_user") return { label: "Internet Decided", color: CORAL };
  return { label: "Resolved", color: BLUE };
}

function svgBannerDataUrl(categoryLabel: string) {
  const label = (categoryLabel || "QUANDR3").toUpperCase();
  const safe = label.replace(/[^A-Z0-9 \-_.]/g, "");
  const bg1 = "#0b2343";
  const bg2 = "#1e63f3";
  const bg3 = "#00a9a5";
  const fg = "#ffffff";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg1}"/>
        <stop offset="0.55" stop-color="${bg2}"/>
        <stop offset="1" stop-color="${bg3}"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.25"/>
      </filter>
    </defs>

    <rect width="1200" height="420" rx="40" fill="url(#g)"/>

    <g filter="url(#s)">
      <rect x="56" y="64" width="1088" height="292" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>
    </g>

    <text x="88" y="140" fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" opacity="0.95">
      REAL PEOPLE. REAL DILEMMAS.
    </text>

    <text x="88" y="220" fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900">
      ${safe}
    </text>

    <text x="88" y="282" fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="26" opacity="0.92">
      Ask • Share • Decide
    </text>

    <circle cx="1120" cy="112" r="28" fill="rgba(255,255,255,0.18)"/>
    <text x="1106" y="122" fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800">?</text>
  </svg>`.trim();

  const encoded = encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function pickCardImageSrc(r: any) {
  if (r?.media_url) return r.media_url;
  if (r?.hero_image_url) return r.hero_image_url;
  return svgBannerDataUrl(r?.category || "QUANDR3");
}

function canShowDiscussionHint(r: any) {
  return r?.status === "resolved";
}

export default function ExploreInner({
  loading,
  err,
  rows,
  q,
  setQ,
  status,
  setStatus,
  sort,
  setSort,
  scope,
  setScope,
  activeCategory,
  setActiveCategory,
  categories,
}: any) {
  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "awaiting_user", label: "Internet Decided" },
    { key: "resolved", label: "Resolved" },
  ];

  const safeRows = rows || [];

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* SOUL HEADER */}
        <div className="rounded-3xl bg-white border p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-xs tracking-widest font-semibold text-slate-500">
                REAL PEOPLE. REAL DILEMMAS.
              </div>
              <h1 className="mt-1 text-4xl font-extrabold" style={{ color: NAVY }}>
                Explore
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                This is where decisions live. Browse open Quandr3s, see what the internet decided,
                and learn from final outcomes — real questions, real reasoning, real closure.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/q/create"
                  className="inline-flex items-center rounded-full px-5 py-3 text-white font-semibold"
                  style={{ background: "linear-gradient(90deg, #1e63f3 0%, #ff6b6b 100%)" }}
                >
                  Create a Quandr3
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center rounded-full px-5 py-3 border font-semibold"
                  style={{ color: NAVY }}
                >
                  About
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full px-5 py-3 border font-semibold"
                  style={{ color: NAVY }}
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Global / Local toggle */}
            <div className="rounded-2xl border p-3 w-full md:w-[320px]">
              <div className="flex gap-2">
                <button
                  onClick={() => setScope?.("global")}
                  className="flex-1 rounded-xl px-4 py-2 font-semibold border"
                  style={{
                    background: scope === "global" ? NAVY : "white",
                    color: scope === "global" ? "white" : NAVY,
                  }}
                >
                  Global
                </button>
                <button
                  onClick={() => setScope?.("local")}
                  className="flex-1 rounded-xl px-4 py-2 font-semibold border"
                  style={{
                    background: scope === "local" ? NAVY : "white",
                    color: scope === "local" ? "white" : NAVY,
                  }}
                >
                  Local
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Local shows posts with a city/state attached.
              </div>
            </div>
          </div>

          {/* Search row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              className="md:col-span-7 rounded-2xl border px-4 py-3"
              placeholder="Search title, context, city, or id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="md:col-span-3 rounded-2xl border px-4 py-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="awaiting_user">Internet Decided</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              className="md:col-span-2 rounded-2xl border px-4 py-3"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="new">Newest</option>
              <option value="closing">Closing Soon</option>
            </select>
          </div>

          {/* Status buttons */}
          <div className="mt-4 rounded-2xl border bg-white p-2">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((t) => {
                const selected = status === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setStatus?.(t.key)}
                    className="rounded-full px-4 py-2 border font-semibold text-sm"
                    style={{
                      background: selected ? NAVY : "white",
                      color: selected ? "white" : NAVY,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="mt-6 rounded-3xl bg-white border p-4">
          <div className="flex flex-wrap gap-2">
            {(categories || ["all"]).map((c: string) => {
              const selected = (activeCategory || "all") === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory?.(c)}
                  className="rounded-full px-4 py-2 border font-semibold text-sm"
                  style={{
                    background: selected ? NAVY : "white",
                    color: selected ? "white" : NAVY,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 STAT BOXES */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "TOP CURIOSO", note: "Coming soon (needs stats wiring)." },
            { title: "TOP WAYFINDER", note: "Coming soon (needs stats wiring)." },
            { title: "TOP QUANDR3", note: "Coming soon (needs stats wiring)." },
            { title: "TRENDING", note: "Coming soon (needs stats wiring)." },
          ].map((b) => (
            <div key={b.title} className="rounded-3xl bg-white border p-5">
              <div className="text-xs tracking-widest font-semibold text-slate-500">
                {b.title}
              </div>
              <div className="mt-2 text-slate-700">{b.note}</div>
            </div>
          ))}
        </div>

        {/* FEED */}
        <div className="mt-6">
          {loading && <div className="text-slate-600">Loading…</div>}
          {err && <div className="text-red-600">{err}</div>}

          <div className="flex flex-col gap-5">
            {safeRows.map((r: any) => {
              const pill = statusPill(r.status);
              const imgSrc = pickCardImageSrc(r);

              return (
                <div key={r.id} className="rounded-3xl bg-white border overflow-hidden">
                  <div className="relative w-full h-[220px] md:h-[260px]">
                    <Image
                      src={imgSrc}
                      alt={r.category || "Quandr3"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1100px"
                      unoptimized
                      priority={false}
                    />

                    <div className="absolute left-4 top-4 flex gap-2">
                      {r.category && (
                        <span
                          className="text-xs px-3 py-1 rounded-full bg-white/90 border font-semibold"
                          style={{ color: NAVY }}
                        >
                          {String(r.category).toUpperCase()}
                        </span>
                      )}
                      <span
                        className="text-xs px-3 py-1 rounded-full text-white font-semibold"
                        style={{ background: pill.color }}
                      >
                        {pill.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <Link href={`/q/${r.id}`}>
                      <h2 className="text-3xl font-extrabold leading-tight" style={{ color: NAVY }}>
                        {r.title || "Untitled Quandr3"}
                      </h2>
                    </Link>

                    {r.context && <p className="mt-2 text-slate-700 text-base">{r.context}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>{fmtDateTime(r.created_at)}</span>

                      {(r.city || r.state) && (
                        <span>
                          {r.city}
                          {r.state ? `, ${r.state}` : ""}
                        </span>
                      )}

                      {r.status === "open" && r.closes_at && <span>{hoursLeft(r.closes_at)}h left</span>}

                      {canShowDiscussionHint(r) ? (
                        <span className="text-slate-500">
                          Discussion available after resolve (voters only to post)
                        </span>
                      ) : (
                        <span className="text-slate-500">Discussion after resolve</span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <Link
                        href={`/q/${r.id}`}
                        className="rounded-full px-5 py-3 font-semibold text-white"
                        style={{ background: NAVY }}
                      >
                        View Quandr3
                      </Link>

                      <div className="flex items-center gap-3">
                        <button className="rounded-full px-5 py-3 border font-semibold" style={{ color: NAVY }}>
                          Share
                        </button>
                        <button className="rounded-full px-5 py-3 border font-semibold text-red-500">
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && !err && safeRows.length === 0 && (
              <div className="rounded-3xl bg-white border p-6 text-slate-600">
                No results yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
