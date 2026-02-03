// @ts-nocheck

import Link from "next/link";

const NAVY = "#0b2343";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

function fmt(ts?: string) {
  return ts ? new Date(ts).toLocaleDateString() : "";
}

function hoursLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 36e5));
}

function statusPill(status: string) {
  if (status === "open") return { label: "Open", color: TEAL };
  if (status === "awaiting_user") return { label: "Internet Decided", color: CORAL };
  return { label: "Resolved", color: BLUE };
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
}: any) {
  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="rounded-3xl bg-white border p-6">
          <h1 className="text-3xl font-semibold" style={{ color: NAVY }}>
            Explore
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Open decisions, Internet-Decided Quandr3s, and resolved outcomes.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              className="md:col-span-7 rounded-2xl border px-4 py-3"
              placeholder="Search title, context, or city…"
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

        {/* Body */}
        <div className="mt-6">
          {loading && <div>Loading…</div>}
          {err && <div className="text-red-600">{err}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            {rows.map((r: any) => {
              const pill = statusPill(r.status);
              return (
                <Link
                  key={r.id}
                  href={`/q/${r.id}`}
                  className="rounded-3xl bg-white border p-5 hover:shadow"
                >
                  <div className="flex justify-between items-start">
                    <h2 className="font-semibold text-lg" style={{ color: NAVY }}>
                      {r.title}
                    </h2>
                    <span
                      className="text-xs px-3 py-1 rounded-full text-white"
                      style={{ background: pill.color }}
                    >
                      {pill.label}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700 line-clamp-3">
                    {r.context}
                  </p>

                  <div className="mt-4 flex justify-between text-xs text-slate-500">
                    <span>
                      {r.city}{r.state ? `, ${r.state}` : ""}
                    </span>
                    {r.status === "open" && (
                      <span>{hoursLeft(r.closes_at)}h left</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
