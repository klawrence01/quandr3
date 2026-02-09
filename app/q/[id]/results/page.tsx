// app/q/[id]/results/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand + Helpers
========================= */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const LETTER = ["A", "B", "C", "D"];

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function cleanReason(s?: string) {
  if (!s) return "";
  const t = String(s).trim();
  if (!t) return "";
  if (t.toUpperCase() === "UPDATED TEXT HERE") return "";
  return t;
}

/** Backward/loose matching so categories like "Money & Finance" still land properly */
function categoryFallback(category?: string) {
  const c = (category || "").toLowerCase();

  if (c.includes("career")) return "/quandr3/placeholders/career.jpg";
  if (c.includes("money") || c.includes("finance")) return "/quandr3/placeholders/money.jpg";
  if (c.includes("love") || c.includes("relationship") || c.includes("dating"))
    return "/quandr3/placeholders/relationships.jpg";
  if (c.includes("health") || c.includes("fitness") || c.includes("wellness"))
    return "/quandr3/placeholders/health.jpg";
  if (c.includes("family") || c.includes("parent") || c.includes("kids"))
    return "/quandr3/placeholders/family.jpg";
  if (c.includes("tech")) return "/quandr3/placeholders/tech.jpg";

  return "/quandr3/placeholders/default.jpg";
}

function getOptImage(opt: any, qCategory?: string) {
  return (
    opt?.image_url ||
    opt?.media_url ||
    opt?.photo_url ||
    opt?.img_url ||
    categoryFallback(qCategory)
  );
}

/* =========================
   Page
========================= */

export default function ResultsPage() {
  const params = useParams();

  const id = useMemo(() => {
    const raw: any = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);

  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);

      const { data: qRow } = await supabase.from("quandr3s").select("*").eq("id", id).single();
      setQ(qRow ?? null);

      const { data: opts } = await supabase
        .from("quandr3_options")
        .select("*")
        .eq("quandr3_id", id)
        .order("order", { ascending: true });
      setOptions(opts ?? []);

      const { data: v } = await supabase.from("quandr3_votes").select("*").eq("quandr3_id", id);
      const vRows = v ?? [];
      setVotes(vRows);

      if (vRows.length) {
        const voteIds = vRows.map((x: any) => x.id).filter(Boolean);

        const { data: rs } = await supabase
          .from("vote_reasons")
          .select("vote_id, reason")
          .in("vote_id", voteIds);

        const map: Record<string, string> = {};
        (rs ?? []).forEach((r: any) => {
          const txt = cleanReason(r.reason);
          if (txt) map[r.vote_id] = txt;
        });
        setReasonsByVoteId(map);
      } else {
        setReasonsByVoteId({});
      }

      const { data: r } = await supabase
        .from("quandr3_resolutions")
        .select("*")
        .eq("quandr3_id", id)
        .maybeSingle();
      setResolution(r ?? null);

      setLoading(false);
    })();
  }, [id]);

  const voteCounts = useMemo(() => {
    const map: Record<number, number> = {};
    votes.forEach((v: any) => {
      map[v.choice_index] = (map[v.choice_index] || 0) + 1;
    });
    return map;
  }, [votes]);

  const totalVotes = votes.length;

  const winningOrder = useMemo(() => {
    let max = 0;
    let win: any = null;
    Object.entries(voteCounts).forEach(([k, v]: any) => {
      if (v > max) {
        max = v;
        win = Number(k);
      }
    });
    return win;
  }, [voteCounts]);

  const reasonsByChoiceIndex = useMemo(() => {
    const grouped: Record<number, string[]> = {};
    votes.forEach((v: any) => {
      const txt = cleanReason(reasonsByVoteId[v.id]);
      if (!txt) return;
      grouped[v.choice_index] = grouped[v.choice_index] || [];
      grouped[v.choice_index].push(txt);
    });
    return grouped;
  }, [votes, reasonsByVoteId]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Results…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling the final vote totals.</div>
          </div>
        </div>
      </main>
    );
  }

  if (!q) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Not found
            </div>
            <div className="mt-2 text-sm text-slate-600">That Quandr3 doesn’t exist (or RLS is blocking it).</div>
            <div className="mt-4">
              <Link
                href="/explore"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: BLUE }}
              >
                Back to Explore
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href={`/q/${id}`} className="text-sm font-extrabold" style={{ color: NAVY }}>
            ← Back to Quandr3
          </Link>

          <Link
            href="/explore"
            className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            style={{ borderColor: "rgba(15,23,42,0.12)" }}
          >
            Explore
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">OPTIONS</div>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
            See how it played out
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Votes and reasons appear after close so everyone learns.
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {options.map((opt: any, i: number) => {
              const count = voteCounts[opt.order] || 0;
              const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

              const isWinner = opt.order === winningOrder;
              const optReasons = reasonsByChoiceIndex[opt.order] ?? [];
              const img = getOptImage(opt, q?.category);

              return (
                <div
                  key={opt.id}
                  className="overflow-hidden rounded-[26px] border bg-white shadow-sm"
                  style={{ borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(15,23,42,0.12)" }}
                >
                  {/* ✅ SMALL THUMB (left) + CONTENT (right) */}
                  <div className="grid md:grid-cols-[160px_1fr]">
                    <div className="relative h-[140px] w-full md:h-full md:min-h-[140px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2343aa] to-transparent" />
                      <div className="absolute left-3 top-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-extrabold text-white"
                          style={{ background: isWinner ? TEAL : NAVY }}
                        >
                          {LETTER[opt.order - 1] ?? String.fromCharCode(65 + i)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                            {safeStr(opt.label) || `Option ${LETTER[opt.order - 1] ?? "?"}`}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {count} vote{count === 1 ? "" : "s"} • {pct}%
                          </div>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold"
                          style={{
                            background: "rgba(0,169,165,0.12)",
                            color: TEAL,
                          }}
                        >
                          {resolution ? "Resolved" : "Closed"}
                        </span>
                      </div>

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: isWinner ? TEAL : BLUE }}
                        />
                      </div>

                      {optReasons.length > 0 ? (
                        <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                          <div className="text-xs font-semibold tracking-widest text-slate-600">
                            WHY PEOPLE CHOSE THIS
                          </div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-800">
                            {optReasons.slice(0, 5).map((txt: string, idx: number) => (
                              <li key={`${opt.id}-r-${idx}`} className="leading-snug">
                                {txt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {resolution?.note ? (
            <div className="mt-7 rounded-2xl border bg-slate-50 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">RESOLUTION NOTE</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{resolution.note}</div>
              <div className="mt-2 text-xs text-slate-600">Resolved {fmt(resolution.created_at)}</div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
