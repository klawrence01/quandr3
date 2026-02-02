// app/explore/_ExploreClient.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pickQuestion(q: any) {
  return (
    safeStr(q.title) ||
    safeStr(q.question) ||
    safeStr(q.prompt) ||
    "Untitled Quandr3"
  );
}

type ExploreRow = {
  id: string;
  title?: string;
  question?: string;
  prompt?: string;
  status?: "open" | "awaiting_user" | "resolved" | string;
  created_at?: string;
  discussion_open?: boolean;
  category?: string;
  scope?: string; // "global" / "local" etc.
};

type SortMode = "trending" | "new" | "resolved";
type StatusFilter = "all" | "open" | "awaiting_user" | "resolved";

const DEFAULT_CATEGORIES = [
  "All",
  "Money",
  "Style",
  "Relationships",
  "Career",
  "Lifestyle",
  "Real Estate",
];

export default function ExploreClient(props: {
  initialCategory?: string;
  initialStatus?: string;
  initialScope?: string;
  initialSort?: string;
}) {
  const router = useRouter();

  // Start from URL-driven initial props (from _ExploreInner)
  const [category, setCategory] = useState<string>(props.initialCategory || "All");
  const [status, setStatus] = useState<StatusFilter>(
    (props.initialStatus as StatusFilter) || "all"
  );
  const [sort, setSort] = useState<SortMode>(
    (props.initialSort as SortMode) || "trending"
  );

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [rows, setRows] = useState<ExploreRow[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  // Keep URL in sync (without useSearchParams)
  useEffect(() => {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("cat", category);
    if (status && status !== "all") params.set("status", status);
    if (sort && sort !== "trending") params.set("sort", sort);

    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, sort]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase
          .from("quandr3s")
          .select("id,title,question,prompt,status,created_at,discussion_open,category,scope")
          .order("created_at", { ascending: false })
          .limit(80);

        if (error) throw error;

        const list: ExploreRow[] = (data || []).map((d: any) => ({
          id: safeStr(d.id),
          title: d.title,
          question: d.question,
          prompt: d.prompt,
          status: d.status || "open",
          created_at: d.created_at,
          discussion_open: !!d.discussion_open,
          category: d.category,
          scope: d.scope,
        }));

        // Vote counts (best-effort across possible vote tables/keys)
        const ids = list.map((q) => q.id).filter(Boolean);
        const counts: Record<string, number> = {};

        if (ids.length) {
          const voteTables = ["votes", "quandr3_votes", "quandry_votes"];
          let got = false;

          for (const vt of voteTables) {
            try {
              // Pull a chunk and count locally (safe + build friendly)
              const { data: vdata, error: verr } = await supabase
                .from(vt)
                .select("quandr3_id,q_id,parent_id")
                .limit(5000);

              if (verr) throw verr;

              for (const v of (vdata || []) as any[]) {
                const qid =
                  safeStr(v.quandr3_id) || safeStr(v.q_id) || safeStr(v.parent_id);
                if (!qid) continue;
                if (!ids.includes(qid)) continue;
                counts[qid] = (counts[qid] || 0) + 1;
              }

              got = true;
              break;
            } catch {
              // try next table
            }
          }

          if (!got) {
            // no-op; voteCounts stays empty
          }
        }

        if (!alive) return;
        setRows(list);
        setVoteCounts(counts);
      } catch (err: any) {
        console.error(err);
        if (!alive) return;
        setErrorMsg(safeStr(err?.message) || "Could not load Explore.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const found = new Set<string>();
    rows.forEach((r) => {
      const c = safeStr((r as any).category);
      if (c) found.add(c);
    });

    const merged = [...DEFAULT_CATEGORIES];
    found.forEach((c) => {
      if (!merged.includes(c)) merged.push(c);
    });

    return merged;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];

    if (category && category !== "All") {
      list = list.filter(
        (r) => safeStr((r as any).category).toLowerCase() === category.toLowerCase()
      );
    }

    if (status !== "all") {
      list = list.filter((r) => (r.status || "open") === status);
    }

    if (sort === "new") {
      list.sort((a, b) => (safeStr(b.created_at) > safeStr(a.created_at) ? 1 : -1));
    } else if (sort === "resolved") {
      list.sort((a, b) => {
        const ar = (a.status || "") === "resolved" ? 1 : 0;
        const br = (b.status || "") === "resolved" ? 1 : 0;
        if (br !== ar) return br - ar;
        return safeStr(b.created_at) > safeStr(a.created_at) ? 1 : -1;
      });
    } else {
      // trending
      list.sort((a, b) => {
        const av = voteCounts[a.id] || 0;
        const bv = voteCounts[b.id] || 0;
        if (bv !== av) return bv - av;
        return safeStr(b.created_at) > safeStr(a.created_at) ? 1 : -1;
      });
    }

    return list;
  }, [rows, category, status, sort, voteCounts]);

  const totalShowing = filtered.length;

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              EXPLORE
            </div>
            <h1 className="mt-1 text-4xl font-extrabold" style={{ color: NAVY }}>
              Find interesting Quandr3s
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Browse real dilemmas. Filter by status and category. Click any card to open
              <span className="font-semibold" style={{ color: NAVY }}> /q/[id]</span>.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/q/create"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create a Quandr3
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>

        {errorMsg ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">
            CATEGORIES
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active ? "text-white" : "bg-white text-slate-800 hover:bg-slate-50"
                  )}
                  style={
                    active
                      ? { background: BLUE, borderColor: "transparent" }
                      : { borderColor: "rgba(15,23,42,0.12)" }
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              STATUS
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["open", "Open"],
                  ["awaiting_user", "Awaiting"],
                  ["resolved", "Resolved"],
                ] as Array<[StatusFilter, string]>
              ).map(([k, label]) => {
                const active = status === k;
                const color =
                  k === "open" ? BLUE : k === "awaiting_user" ? CORAL : k === "resolved" ? TEAL : NAVY;

                return (
                  <button
                    key={k}
                    onClick={() => setStatus(k)}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      active ? "text-white" : "bg-white text-slate-800 hover:bg-slate-50"
                    )}
                    style={
                      active
                        ? { background: color, borderColor: "transparent" }
                        : { borderColor: "rgba(15,23,42,0.12)" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              SORT
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["trending", "Trending"],
                  ["new", "New"],
                  ["resolved", "Resolved-first"],
                ] as Array<[SortMode, string]>
              ).map(([k, label]) => {
                const active = sort === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      active ? "text-white" : "bg-white text-slate-800 hover:bg-slate-50"
                    )}
                    style={
                      active
                        ? { background: NAVY, borderColor: "transparent" }
                        : { borderColor: "rgba(15,23,42,0.12)" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Trending uses vote-count when available; otherwise it falls back to newest.
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold" style={{ color: NAVY }}>
                {totalShowing}
              </span>{" "}
              Quandr3{totalShowing === 1 ? "" : "s"}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
              title="Refresh Explore"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold" style={{ color: NAVY }}>
                Loading Explore…
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Pulling Quandr3s and computing vote counts.
              </div>
            </div>
          ) : totalShowing === 0 ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold" style={{ color: NAVY }}>
                No matches
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Try switching category, status, or sort.
              </div>
              <div className="mt-4">
                <Link
                  href="/q/create"
                  className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: BLUE }}
                >
                  Create the first one in this filter
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((q) => {
                const st = q.status || "open";
                const votes = voteCounts[q.id] || 0;

                const pillBg =
                  st === "resolved"
                    ? "rgba(0,169,165,0.12)"
                    : st === "awaiting_user"
                    ? "rgba(255,107,107,0.12)"
                    : "rgba(30,99,243,0.12)";

                const pillColor =
                  st === "resolved" ? TEAL : st === "awaiting_user" ? CORAL : BLUE;

                const created = safeStr(q.created_at)
                  ? new Date(q.created_at as any).toLocaleString()
                  : "";

                return (
                  <Link
                    key={q.id}
                    href={`/q/${q.id}`}
                    className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                    style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: pillBg, color: pillColor }}
                      >
                        {st === "awaiting_user" ? "awaiting" : st}
                      </span>

                      <span className="text-xs text-slate-500">
                        {votes} vote{votes === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div
                      className="mt-3 text-lg font-extrabold leading-snug transition group-hover:underline"
                      style={{ color: NAVY }}
                    >
                      {pickQuestion(q)}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {created ? `Created: ${created}` : "Created: —"}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        {safeStr((q as any).category) ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            {safeStr((q as any).category)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            Uncategorized
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-semibold" style={{ color: BLUE }}>
                        Open →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          Quandr3 • Ask • Share • Decide
        </div>
      </div>
    </main>
  );
}
