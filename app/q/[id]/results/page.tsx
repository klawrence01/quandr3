// app/q/[id]/results/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
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

export default function Quandr3ResultsPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw: any = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [user, setUser] = useState<any>(null);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);
  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  async function refreshVotesAndReasons(qid: string) {
    const { data: v } = await supabase.from("quandr3_votes").select("*").eq("quandr3_id", qid);
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

    return vRows;
  }

  async function refreshCore(qid: string) {
    const { data: qRow } = await supabase.from("quandr3s").select("*").eq("id", qid).single();
    setQ(qRow ?? null);

    const { data: opts } = await supabase
      .from("quandr3_options")
      .select("*")
      .eq("quandr3_id", qid)
      .order("order", { ascending: true });

    setOptions(opts ?? []);

    await refreshVotesAndReasons(qid);

    const { data: r } = await supabase
      .from("quandr3_resolutions")
      .select("*")
      .eq("quandr3_id", qid)
      .maybeSingle();

    setResolution(r ?? null);
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      await refreshCore(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* =========================
     Derived
  ========================= */

  const totalVotes = votes.length;

  const voteCounts = useMemo(() => {
    const map: Record<number, number> = {};
    votes.forEach((v: any) => {
      map[v.choice_index] = (map[v.choice_index] || 0) + 1;
    });
    return map;
  }, [votes]);

  const reasonsByChoiceIndex = useMemo(() => {
    const grouped: Record<number, string[]> = {};
    votes.forEach((v: any) => {
      const rid = v.id;
      const txt = cleanReason(reasonsByVoteId[rid]);
      if (!txt) return;
      const idx = v.choice_index;
      grouped[idx] = grouped[idx] || [];
      grouped[idx].push(txt);
    });
    return grouped;
  }, [votes, reasonsByVoteId]);

  const winningOrder = useMemo(() => {
    // If resolution exists, use it (that is the "truth" of how it played out).
    if (resolution?.option_id) {
      const opt = options.find((o: any) => o.id === resolution.option_id);
      return opt?.order ?? null;
    }

    // Otherwise, just show vote leader as "top voted"
    noticed: {
      let max = 0;
      let win: any = null;
      Object.entries(voteCounts).forEach(([k, v]: any) => {
        if (v > max) {
          max = v;
          win = Number(k);
        }
      });
      return win;
    }
  }, [resolution, options, voteCounts]);

  /* =========================
     Render
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Results…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling votes + reasons.</div>
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
            <div className="mt-2 text-sm text-slate-600">That Quandr3 ID doesn’t exist (or RLS is blocking it).</div>
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
      {/* Top header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href={`/q/${id}`} className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
            >
              <span className="text-lg" style={{ color: NAVY }}>
                ←
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Results
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                SEE HOW IT PLAYED OUT
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/q/create"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create a Quandr3
            </Link>
            <Link
              href="/explore"
              className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
            >
              Explore
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Title block */}
        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">QUANDR3</div>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
            {safeStr(q.title) || "Untitled Quandr3"}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
              {safeStr(q.category || "Category")}
            </span>
            <span className="text-xs">•</span>
            <span className="text-xs">
              {totalVotes} vote{totalVotes === 1 ? "" : "s"}
            </span>
            <span className="text-xs">•</span>
            <span className="text-xs">Created {fmt(q.created_at)}</span>

            {resolution ? (
              <>
                <span className="text-xs">•</span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700">
                  Resolved
                </span>
              </>
            ) : (
              <>
                <span className="text-xs">•</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                  Closed
                </span>
              </>
            )}
          </div>

          <div className="mt-4">
            <Link
              href={`/q/${id}`}
              className="inline-flex items-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm"
              style={{ background: NAVY }}
            >
              Back to Quandr3
            </Link>
          </div>
        </section>

        {/* Options — SAME thumbnail-left layout */}
        <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">OPTIONS</div>
          <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
            See how it played out
          </div>
          <div className="mt-1 text-sm text-slate-600">Votes and reasons appear after close so everyone learns.</div>

          {!options?.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              No options found for this Quandr3 yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
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
                    style={{
                      borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(15,23,42,0.12)",
                    }}
                  >
                    {/* SAME thumbnail-left layout as detail */}
                    <div className="grid gap-0 md:grid-cols-[160px_1fr]">
                      {/* Thumbnail */}
                      <div className="relative h-[140px] w-full bg-slate-900 md:h-full md:min-h-[140px] md:w-[160px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover opacity-95" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2343aa] via-transparent to-transparent" />

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
                            style={{ background: isWinner ? TEAL : NAVY }}
                          >
                            {LETTER[opt.order - 1] ?? String.fromCharCode(65 + i)}
                          </span>
                        </div>

                        {isWinner ? (
                          <div className="absolute bottom-3 left-3">
                            <span
                              className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold"
                              style={{ color: TEAL }}
                            >
                              Winning path
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Content */}
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

                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700">
                            {resolution ? "Resolved" : "Closed"}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: isWinner ? TEAL : BLUE,
                              }}
                            />
                          </div>
                        </div>

                        {optReasons.length > 0 ? (
                          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-600">
                              WHY PEOPLE CHOSE THIS
                            </div>
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-800">
                              {optReasons.slice(0, 6).map((txt: string, idx: number) => (
                                <li key={`${opt.id}-r-${idx}`} className="leading-snug">
                                  {txt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
                            No reasons yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Resolution note (if exists) */}
        {resolution ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">RESOLUTION</div>
            <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
              The Curioso decided
            </div>

            <div className="mt-4 rounded-2xl border bg-slate-50 p-5">
              <div className="whitespace-pre-wrap text-sm text-slate-800">
                {resolution.note ? resolution.note : "No note was left for this resolution."}
              </div>
              <div className="mt-3 text-xs text-slate-600">
                Resolved on <span className="font-semibold">{fmt(resolution.created_at)}</span>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">Quandr3 • Ask • Share • Decide</div>
      </div>
    </main>
  );
}
