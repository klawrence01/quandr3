// @ts-nocheck

import Link from "next/link";

const NAVY = "#0b2343";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

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

function catColor(category?: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("career")) return CORAL;
  if (c.includes("relationship")) return TEAL;
  if (c.includes("money")) return BLUE;
  return NAVY;
}

function initials(name?: string) {
  const n = (name || "C").trim();
  const parts = n.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "C";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
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
  localCity,
  setLocalCity,
  localState,
  setLocalState,

  categories,
  activeCategory,
  setActiveCategory,
}: any) {
  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* =========================
            SOUL BLOCK (mini homepage)
        ========================= */}
        <div
          className="rounded-3xl border bg-white p-6"
          style={{
            boxShadow: "0 10px 30px rgba(11,35,67,0.08)",
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs tracking-[0.2em] font-semibold text-slate-500">
                REAL PEOPLE. REAL DILEMMAS.
              </div>

              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold" style={{ color: NAVY }}>
                Explore real decisions. Learn from real outcomes.
              </h1>

              <p className="mt-3 text-slate-700 leading-relaxed">
                Browse open Quandr3s, help others think clearly, and see how people ultimately
                decided.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2">
                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                  Ask
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                  Share
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                  Decide
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                  Learn
                </span>
              </div>
            </div>

            {/* Global / Local toggle (near soul block, as requested) */}
            <div className="flex flex-col gap-3 min-w-[260px]">
              <div className="text-xs font-semibold text-slate-500">SCOPE</div>

              <div className="flex rounded-2xl border overflow-hidden">
                <button
                  className="flex-1 px-4 py-2 text-sm font-semibold"
                  style={{
                    background: scope === "global" ? NAVY : "white",
                    color: scope === "global" ? "white" : NAVY,
                  }}
                  onClick={() => setScope("global")}
                >
                  Global
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm font-semibold"
                  style={{
                    background: scope === "local" ? NAVY : "white",
                    color: scope === "local" ? "white" : NAVY,
                  }}
                  onClick={() => setScope("local")}
                >
                  Local
                </button>
              </div>

              {scope === "local" && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-2xl border px-3 py-2 text-sm"
                    placeholder="City"
                    value={localCity}
                    onChange={(e) => setLocalCity(e.target.value)}
                  />
                  <input
                    className="rounded-2xl border px-3 py-2 text-sm"
                    placeholder="State"
                    value={localState}
                    onChange={(e) => setLocalState(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href="/q/create"
                  className="flex-1 rounded-2xl px-4 py-2 text-center text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(90deg, ${BLUE}, ${CORAL})`,
                  }}
                >
                  Create a Quandr3
                </Link>

                <Link
                  href="/"
                  className="rounded-2xl border px-4 py-2 text-center text-sm font-semibold"
                  style={{ color: NAVY }}
                >
                  Home
                </Link>
              </div>
            </div>
          </div>

          {/* Search directly underneath (as requested) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              className="md:col-span-7 rounded-2xl border px-4 py-3"
              placeholder="Search questions, context, city, or ID…"
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

          {/* Categories pills (white pills — required) */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <button
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold"
              style={{
                background: activeCategory === "all" ? NAVY : "white",
                color: activeCategory === "all" ? "white" : NAVY,
              }}
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>

            {(categories || [])
              .filter((c: any) => c?.label)
              .map((c: any) => {
                const on = (activeCategory || "").toLowerCase() === (c.slug || c.label || "").toLowerCase();
                const value = (c.slug || c.label || "").toString();
                return (
                  <button
                    key={c.id || value}
                    className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold"
                    style={{
                      background: on ? NAVY : "white",
                      color: on ? "white" : NAVY,
                    }}
                    onClick={() => setActiveCategory(value)}
                    title={value}
                  >
                    {c.label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* =========================
            FEED (Vertical / Reddit-like)
        ========================= */}
        <div className="mt-6">
          {loading && <div className="text-slate-600">Loading…</div>}
          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {err}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {rows.map((r: any) => {
              const pill = statusPill(r.status);
              const cat = (r.category || "General").toString();
              const catP = catColor(cat);

              const media = (r.hero_image_url || r.media_url || "").toString().trim();
              const showMedia = true; // always show holder (even if placeholder)

              const loc = [r.city, r.state].filter(Boolean).join(", ");
              const left = r.status === "open" ? `${hoursLeft(r.closes_at)}h left` : "";

              const curiosoName = (r.curiosoName || "Curioso").toString();
              const avatar = (r.curiosoAvatar || "").toString();

              return (
                <Link
                  key={r.id}
                  href={`/q/${r.id}`}
                  className="rounded-3xl bg-white border p-5 hover:shadow"
                  style={{ transition: "box-shadow 150ms ease" }}
                >
                  {/* top row: category + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: "white", border: `1px solid ${catP}`, color: catP }}
                      >
                        {cat.toUpperCase()}
                      </span>

                      {r.sponsored_start && r.sponsored_end && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" }}
                        >
                          SPONSORED
                        </span>
                      )}

                      {r.discussion_open === true && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: "#ecfeff", border: "1px solid #22d3ee", color: "#155e75" }}
                        >
                          DISCUSSION OPEN
                        </span>
                      )}
                    </div>

                    <span
                      className="text-xs px-3 py-1 rounded-full text-white font-semibold"
                      style={{ background: pill.color }}
                    >
                      {pill.label}
                    </span>
                  </div>

                  {/* title */}
                  <h2 className="mt-3 font-extrabold text-xl" style={{ color: NAVY }}>
                    {r.title}
                  </h2>

                  {/* media holder + context */}
                  <div className="mt-3 flex gap-4">
                    {showMedia && (
                      <div
                        className="shrink-0 rounded-2xl border overflow-hidden"
                        style={{ width: 140, height: 90, background: "#f8fafc" }}
                      >
                        {media ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={media}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                            Media
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {r.context || "No context provided yet."}
                    </p>
                  </div>

                  {/* meta row */}
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatar}
                          alt=""
                          className="rounded-full border"
                          style={{ width: 22, height: 22, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded-full border flex items-center justify-center font-bold"
                          style={{ width: 22, height: 22, color: NAVY, background: "#f1f5f9" }}
                        >
                          {initials(curiosoName)}
                        </div>
                      )}
                      <span className="font-semibold" style={{ color: NAVY }}>
                        {curiosoName}
                      </span>

                      {loc && <span>• {loc}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      {left && <span className="font-semibold">{left}</span>}
                      {r.id && <span title={r.id}>#{String(r.id).slice(0, 6)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!loading && !err && rows.length === 0 && (
            <div className="mt-6 rounded-3xl border bg-white p-6 text-slate-700">
              No results yet. Try removing filters, switching to Global, or creating the first Quandr3.
            </div>
          )}
        </div>

        {/* =========================
            Footer links (requested)
        ========================= */}
        <div className="mt-10 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/about" className="hover:underline">
            About Us
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact Us
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
