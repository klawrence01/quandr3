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
        {/* FEED */}
        <div id="feed" className="mt-6">
          {loading && <div className="text-slate-600">Loading…</div>}

          {/* Hide debug error in production */}
          {err && process.env.NODE_ENV !== "production" && (
            <div className="text-red-600">{err}</div>
          )}

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

                    {/* Posted by */}
                    <div className="mt-1 text-sm text-slate-500">
                      Posted by{" "}
                      <span className="font-semibold" style={{ color: NAVY }}>
                        {r.creator_name || (r.user_id ? `Curioso ${String(r.user_id).slice(0, 6)}` : "Curioso")}
                      </span>
                    </div>

                    {r.context && <p className="mt-2 text-slate-700 text-base">{r.context}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>{fmtDateTime(r.created_at)}</span>
                    </div>

                    <div className="mt-5">
                      <Link
                        href={`/q/${r.id}`}
                        className="rounded-full px-5 py-3 font-semibold text-white inline-block"
                        style={{ background: NAVY }}
                      >
                        View Quandr3
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && !err && safeRows.length === 0 && (
              <div className="rounded-3xl bg-white border p-6 text-slate-600">No results yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
