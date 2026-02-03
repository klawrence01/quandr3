// @ts-nocheck

import Link from "next/link";

const NAVY = "#0b2343";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

function fmtDateTime(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function hoursLeft(closesAt: string) {
  if (!closesAt) return 0;
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 36e5));
}

function statusPill(status: string) {
  if (status === "open") return { label: "Open", color: TEAL };
  if (status === "awaiting_user") return { label: "Internet Decided", color: CORAL };
  return { label: "Resolved", color: BLUE };
}

function prettyCategory(c?: string) {
  const s = String(c || "").trim();
  if (!s) return "";
  return s.toUpperCase();
}

async function doShare(url: string, title: string) {
  try {
    // If native share exists
    // @ts-ignore
    if (navigator?.share) {
      // @ts-ignore
      await navigator.share({ title: "Quandr3", text: title, url });
      return true;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {}
  return false;
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
  categories,
  activeCategory,
  setActiveCategory,
}: any) {
  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* SOUL / EXPLAINER + CONTROLS */}
        <div className="rounded-3xl bg-white border p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                REAL PEOPLE. REAL DILEMMAS.
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold" style={{ color: NAVY }}>
                Explore
              </h1>
              <p className="mt-2 text-slate-700">
                This is where decisions live. Browse open Quandr3s, see what the internet decided,
                and learn from final outcomes — real questions, real reasoning, real closure.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/q/create"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(90deg, ${BLUE}, ${CORAL})` }}
                >
                  Create a Quandr3
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border"
                  style={{ color: NAVY, borderColor: "#e5e7eb" }}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border"
                  style={{ color: NAVY, borderColor: "#e5e7eb" }}
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Local/Global toggle */}
            <div className="w-full md:w-auto">
              <div className="rounded-2xl border p-2 bg-white">
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope("all")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border"
                    style={{
                      background: scope === "all" ? NAVY : "white",
                      color: scope === "all" ? "white" : NAVY,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setScope("local")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border"
                    style={{
                      background: scope === "local" ? NAVY : "white",
                      color: scope === "local" ? "white" : NAVY,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    Local
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Local shows posts with a city/state attached.
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
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
        </div>

        {/* CATEGORY PILLS (right under top block) */}
        <div className="mt-4 rounded-3xl border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {(categories || ["all"]).map((c: string) => {
              const active = c === activeCategory;
              const label = c === "all" ? "All" : c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className="px-4 py-2 rounded-full text-sm font-semibold border"
                  style={{
                    background: active ? NAVY : "white",
                    color: active ? "white" : NAVY,
                    borderColor: "#e5e7eb",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* OPTIONAL: Top stats boxes (stub for now) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {["Top Curioso", "Top Wayfinder", "Top Quandr3", "Trending"].map((t) => (
            <div key={t} className="rounded-3xl border bg-white p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">{t.toUpperCase()}</div>
              <div className="mt-2 text-sm text-slate-600">
                Coming soon (needs stats wiring).
              </div>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="mt-6">
          {loading && <div className="text-slate-600">Loading…</div>}
          {err && <div className="text-red-600">{err}</div>}

          {/* ✅ VERTICAL FEED (Reddit-like) */}
          <div className="flex flex-col gap-4">
            {rows.map((r: any) => {
              const pill = statusPill(r.status);

              // ✅ DISCUSSION RULE:
              // Discussion cannot be open during "open" or "awaiting_user"
              // Only matters after "resolved"
              const discussionIsEligible = r.status === "resolved";
              const showDiscussionOpen = discussionIsEligible && !!r.discussion_open;

              const media = r.media_url || r.hero_image_url || "";
              const categoryLabel = prettyCategory(r.category);

              return (
                <div key={r.id} className="rounded-3xl bg-white border overflow-hidden">
                  {/* Media block (bigger / full width) */}
                  {media ? (
                    <div className="relative w-full" style={{ background: NAVY }}>
                      <div className="w-full" style={{ paddingTop: "40%" }} />
                      {/* Use plain img to avoid Next Image config issues */}
                      <img
                        src={media}
                        alt="Quandr3 media"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Gradient overlay for interest */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(11,35,67,0.10) 0%, rgba(11,35,67,0.65) 100%)",
                        }}
                      />
                      <div className="absolute left-4 bottom-3 flex items-center gap-2">
                        {categoryLabel ? (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                            style={{ background: "rgba(255,255,255,0.16)" }}>
                            {categoryLabel}
                          </span>
                        ) : null}
                        <span
                          className="text-xs px-3 py-1 rounded-full text-white font-semibold"
                          style={{ background: pill.color }}
                        >
                          {pill.label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 pt-5">
                      <div className="flex items-center gap-2">
                        {categoryLabel ? (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ color: NAVY, background: "#eef2ff" }}>
                            {categoryLabel}
                          </span>
                        ) : null}
                        <span
                          className="text-xs px-3 py-1 rounded-full text-white font-semibold"
                          style={{ background: pill.color }}
                        >
                          {pill.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex flex-col gap-2">
                      <Link href={`/q/${r.id}`} className="block">
                        <h2 className="font-extrabold text-xl md:text-2xl leading-tight" style={{ color: NAVY }}>
                          {r.title}
                        </h2>
                      </Link>

                      {r.context ? (
                        <p className="text-sm md:text-base text-slate-700">
                          {r.context}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">
                          (No context yet.)
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{r.city}{r.state ? `, ${r.state}` : ""}</span>
                          <span>•</span>
                          <span>{fmtDateTime(r.created_at)}</span>
                          {r.status === "open" && r.closes_at ? (
                            <>
                              <span>•</span>
                              <span className="font-semibold">{hoursLeft(r.closes_at)}h left</span>
                            </>
                          ) : null}
                          {discussionIsEligible ? (
                            <>
                              <span>•</span>
                              <span className="font-semibold" style={{ color: showDiscussionOpen ? TEAL : NAVY }}>
                                {showDiscussionOpen ? "Discussion Open" : "Discussion After Resolve"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className="font-semibold" style={{ color: NAVY }}>
                                Discussion After Resolve
                              </span>
                            </>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full px-3 py-1 border text-xs font-semibold"
                            style={{ color: NAVY, borderColor: "#e5e7eb" }}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = `${window.location.origin}/q/${r.id}`;
                              const ok = await doShare(url, r.title || "Quandr3");
                              if (!ok) alert("Couldn’t share/copy link on this device.");
                              else alert("Link copied / shared.");
                            }}
                          >
                            Share
                          </button>

                          <button
                            className="rounded-full px-3 py-1 border text-xs font-semibold"
                            style={{ color: CORAL, borderColor: "#fde2e2" }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = `${window.location.origin}/q/${r.id}`;
                              // Basic “report” placeholder. We’ll wire this to quandr3_reports next.
                              window.location.href =
                                `mailto:support@quandr3.com?subject=Report%20Quandr3&body=` +
                                encodeURIComponent(`I want to report this Quandr3:\n\n${url}\n\nReason:\n`);
                            }}
                          >
                            Report
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/q/${r.id}`}
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white"
                          style={{ background: NAVY }}
                        >
                          View Quandr3
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && !err && (!rows || rows.length === 0) ? (
              <div className="rounded-3xl border bg-white p-6 text-slate-600">
                No results yet. Try changing filters or create the first Quandr3 for this category.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
