// app/quandr3/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";
import { COLORS } from "@/app/styles/colors";

type Quandr3Row = {
  id: string;
  category: string;
  title: string;
  context: string | null;
  status: string;
  created_at: string;
  closes_at: string | null;
  resolution_window: string | null;
};

const CATEGORY_FILTERS = ["All", "Money", "Style", "Relationships"] as const;
const STATUS_FILTERS = ["All", "Open", "Closed"] as const;

export default function Quandr3FeedPage() {
  const router = useRouter();

  const [items, setItems] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_FILTERS)[number]>("All");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("quandr3s")
        .select(
          "id, category, title, context, status, created_at, closes_at, resolution_window"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setError(error.message || "Failed to load Quandr3s.");
      } else {
        setItems((data || []) as Quandr3Row[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  const filtered = items.filter((q) => {
    const categoryOk =
      categoryFilter === "All" || q.category === categoryFilter;
    const statusOk =
      statusFilter === "All" ||
      (statusFilter === "Open" && q.status === "open") ||
      (statusFilter === "Closed" && q.status !== "open");
    return categoryOk && statusOk;
  });

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: COLORS.SOFT_BG,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold mb-1">Quandr3 Feed</h1>
            <p
              className="text-xs"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Real dilemmas. Real people. See what’s on the table today.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/quandr3/new")}
            className="text-xs font-semibold px-3 py-2 rounded-full"
            style={{
              backgroundColor: COLORS.NAVY,
              color: COLORS.WHITE,
              border: `1px solid ${COLORS.NAVY}`,
            }}
          >
            + New Quandr3
          </button>
        </header>

        {/* FILTERS */}
        <section className="mb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: active ? COLORS.NAVY : COLORS.WHITE,
                    color: active ? COLORS.WHITE : COLORS.TEXT_PRIMARY,
                    border: `1px solid ${
                      active ? COLORS.NAVY : COLORS.BORDER
                    }`,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span
              className="font-semibold uppercase tracking-wide"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Status:
            </span>
            {STATUS_FILTERS.map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    fontSize: 11,
                    backgroundColor: active ? COLORS.OVERLAY : "transparent",
                    color: active ? COLORS.NAVY : COLORS.TEXT_SECONDARY,
                    border: `1px solid ${
                      active ? COLORS.NAVY : "transparent"
                    }`,
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </section>

        {/* CONTENT */}
        {loading && (
          <div className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
            Loading Quandr3s…
          </div>
        )}

        {error && !loading && (
          <div
            className="text-sm rounded-xl px-4 py-3"
            style={{
              backgroundColor: COLORS.WHITE,
              border: `1px solid ${COLORS.CORAL}`,
              color: COLORS.CORAL,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-3"
            style={{
              backgroundColor: COLORS.WHITE,
              border: `1px solid ${COLORS.BORDER}`,
              color: COLORS.TEXT_SECONDARY,
            }}
          >
            No Quandr3s match this view yet. Try a different filter or create
            the first one.
          </div>
        )}

        {/* LIST */}
        <section className="space-y-3">
          {filtered.map((q) => (
            <article
              key={q.id}
              className="rounded-2xl px-4 py-4 cursor-pointer"
              onClick={() => router.push(`/quandr3/${q.id}`)}
              style={{
                backgroundColor: COLORS.WHITE,
                border: `1px solid ${COLORS.BORDER}`,
              }}
            >
              {/* Top row: category + status + time */}
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: COLORS.NAVY,
                      color: COLORS.WHITE,
                    }}
                  >
                    {q.category}
                  </span>

                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        q.status === "open"
                          ? COLORS.OVERLAY
                          : "rgba(11,35,67,0.04)",
                      color:
                        q.status === "open"
                          ? COLORS.TEAL
                          : COLORS.TEXT_PRIMARY,
                    }}
                  >
                    {q.status}
                  </span>
                </div>

                <span
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: COLORS.BLUE }}
                >
                  {buildTimeLabel(q)}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-sm font-semibold mb-1">{q.title}</h2>

              {/* Context preview */}
              {q.context && (
                <p
                  className="text-xs mb-2 line-clamp-2"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {q.context}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: COLORS.TEXT_SECONDARY }}>
                  Posted {new Date(q.created_at).toLocaleString()}
                </span>

                <Link
                  href={`/quandr3/${q.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: COLORS.BLUE }}
                >
                  View details →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function buildTimeLabel(q: Quandr3Row): string {
  if (!q.closes_at) return q.resolution_window || "";

  const now = new Date();
  const closes = new Date(q.closes_at);
  const diffMs = closes.getTime() - now.getTime();
  if (diffMs <= 0) return "Closed";

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) return `${diffMinutes} min left`;
  if (diffHours < 24) return `${diffHours} hours left`;
  return `${diffDays} days left`;
}
