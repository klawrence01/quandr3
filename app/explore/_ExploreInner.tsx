// @ts-nocheck

import Link from "next/link";
import { useMemo } from "react";

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
    return ts || "";
  }
}

function hoursLeft(createdAt: string, durationHours: number) {
  const end = new Date(createdAt).getTime() + durationHours * 3600 * 1000;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function pillColor(status: string) {
  if (status === "open")
    return { bg: "rgba(0,169,165,0.12)", fg: TEAL, bd: "rgba(0,169,165,0.35)", label: "Open" };
  if (status === "awaiting_user")
    return { bg: "rgba(255,107,107,0.12)", fg: CORAL, bd: "rgba(255,107,107,0.35)", label: "Internet Decided" };
  return { bg: "rgba(30,99,243,0.10)", fg: BLUE, bd: "rgba(30,99,243,0.25)", label: "Resolved" };
}

export default function ExploreInner(props: any) {
  const { loading, err, rows, q, setQ, status, setStatus, sort, setSort } = props;

  const countText = useMemo(() => {
    if (loading) return "";
    return `${rows?.length || 0} result${(rows?.length || 0) === 1 ? "" : "s"}`;
  }, [loading, rows]);

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div
          className="rounded-3xl border shadow-sm p-6"
          style={{ background: "white", borderColor: "rgba(11,35,67,0.10)" }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm" style={{ color: NAVY, opacity: 0.7 }}>
                QUANDR3
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: NAVY }}>
                Explore
              </h1>
              <p className="mt-1 text-sm md:text-base" style={{ color: NAVY, opacity: 0.75 }}>
                Browse open decisions, “Internet Decided” posts awaiting the Curioso, and resolved outcomes.
              </p>
              <div className="mt-2 text-xs" style={{ color: NAVY, opacity: 0.6 }}>
                {countText}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/q/create"
                className="px-4 py-2 rounded-xl font-medium border"
                style={{ background: NAVY, borderColor: NAVY, color: "white" }}
              >
                Create a Quandr3
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl font-medium border"
                style={{ background: "white", borderColor: "rgba(11,35,67,0.20)", color: NAVY }}
              >
                Home
              </Link>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, question, or id…"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{ borderColor: "rgba(11,35,67,0.15)" }}
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
                style={{ borderColor: "rgba(11,35,67,0.15)", background: "white" }}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="awaiting_user">Awaiting Curioso</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
                style={{ borderColor: "rgba(11,35,67,0.15)", background: "white" }}
              >
                <option value="new">Newest</option>
                <option value="old">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border p-6" style={{ background: "white", borderColor: "rgba(11,35,67,0.10)" }}>
              <div className="text-sm" style={{ color: NAVY, opacity: 0.7 }}>
                Loading…
              </div>
            </div>
          ) : err ? (
            <div className="rounded-3xl border p-6" style={{ background: "white", borderColor: "rgba(255,107,107,0.35)" }}>
              <div className="font-semibold" style={{ color: CORAL }}>
                Couldn’t load Explore
              </div>
              <div className="mt-1 text-sm" style={{ color: NAVY, opacity: 0.8 }}>
                {err}
              </div>
            </div>
          ) : rows?.length === 0 ? (
            <div className="rounded-3xl border p-6" style={{ background: "white", borderColor: "rgba(11,35,67,0.10)" }}>
              <div className="font-semibold" style={{ color: NAVY }}>
                Nothing found
              </div>
              <div className="mt-1 text-sm" style={{ color: NAVY, opacity: 0.75 }}>
                Try a different search or remove filters.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rows.map((r: any) => {
                const pill = pillColor(r.status);
                const duration = Number(r.voting_duration_hours || 24);
                const left = r.status === "open" ? hoursLeft(r.created_at, duration) : 0;

                return (
                  <Link
                    key={r.id}
                    href={`/q/${r.id}`}
                    className="block rounded-3xl border shadow-sm hover:shadow-md transition p-5"
                    style={{ background: "white", borderColor: "rgba(11,35,67,0.10)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm" style={{ color: NAVY, opacity: 0.6 }}>
                          {fmt(r.created_at)}
                        </div>
                        <div className="mt-1 text-lg font-semibold line-clamp-2" style={{ color: NAVY }}>
                          {r.title || "Untitled Quandr3"}
                        </div>
                      </div>

                      <div
                        className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full border"
                        style={{ background: pill.bg, color: pill.fg, borderColor: pill.bd }}
                      >
                        {pill.label}
                      </div>
                    </div>

                    <div className="mt-3 text-sm line-clamp-3" style={{ color: NAVY, opacity: 0.8 }}>
                      {r.question || "—"}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      {r.status === "open" ? (
                        <span className="text-xs font-medium" style={{ color: TEAL }}>
                          {left}h left
                        </span>
                      ) : null}

                      {r.discussion_open ? (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full border"
                          style={{
                            color: BLUE,
                            background: "rgba(30,99,243,0.08)",
                            borderColor: "rgba(30,99,243,0.20)",
                          }}
                        >
                          Discussion open
                        </span>
                      ) : (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full border"
                          style={{
                            color: NAVY,
                            opacity: 0.75,
                            background: "rgba(11,35,67,0.04)",
                            borderColor: "rgba(11,35,67,0.10)",
                          }}
                        >
                          Discussion closed
                        </span>
                      )}

                      <span className="text-xs" style={{ color: NAVY, opacity: 0.55 }}>
                        ID: {String(r.id).slice(0, 8)}…
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
