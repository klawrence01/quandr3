// /app/q/[id]/results/page.tsx
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

const LETTER = ["A", "B", "C", "D", "E", "F"];

const CATEGORY_HERO: Record<string, string> = {
  money: "/quandr3/placeholders/money.jpg",
  career: "/quandr3/placeholders/career.jpg",
  relationships: "/quandr3/placeholders/relationships.jpg",
  health: "/quandr3/placeholders/health.jpg",
  family: "/quandr3/placeholders/family.jpg",
  tech: "/quandr3/placeholders/tech.jpg",
};

function heroForCategory(category?: string) {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_HERO[key] || "/quandr3/placeholders/default.jpg";
}

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

function getCreatorId(qRow: any) {
  return qRow?.author_id || qRow?.user_id || qRow?.creator_id || qRow?.created_by || null;
}

function creatorLabel(qRow: any, profile: any) {
  if (profile?.display_name) return profile.display_name;
  if (qRow?.creator_name) return qRow.creator_name;
  const cid = getCreatorId(qRow);
  if (cid) return `Curioso ${String(cid).slice(0, 6)}`;
  return "Curioso";
}

function statusLabel(kind: "open" | "awaiting_user" | "resolved") {
  if (kind === "open") return { bg: "rgba(30,99,243,0.12)", fg: BLUE, label: "Open" };
  if (kind === "awaiting_user")
    return { bg: "rgba(255,107,107,0.12)", fg: CORAL, label: "Closed (Awaiting Curioso)" };
  return { bg: "rgba(0,169,165,0.12)", fg: TEAL, label: "Resolved" };
}

// Option order can be stored as: order, idx, position, choice_index, etc.
function getOptOrder(opt: any, fallback: number) {
  const candidates = [
    opt?.order,
    opt?.idx,
    opt?.position,
    opt?.choice_index,
    opt?.choiceOrder,
    opt?.sort_order,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return fallback;
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

  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>({});
  const [showAllReasons, setShowAllReasons] = useState(false);

  const totalVotes = votes.length;

  const zeroBasedVotes = useMemo(() => {
    if (!votes?.length) return false;
    const mins = Math.min(...votes.map((v: any) => Number(v.choice_index ?? 9999)));
    return mins === 0;
  }, [votes]);

  function normChoiceIndex(vChoice: any) {
    const n = Number(vChoice);
    if (Number.isNaN(n)) return null;
    return zeroBasedVotes ? n + 1 : n; // normalize to 1-based for display + matching
  }

  async function fetchOptionsRobust(qid: string) {
    // Try common ordering columns in priority order, fallback to created_at
    const tries = ["order", "idx", "position", "choice_index", "sort_order", "created_at"];
    for (const col of tries) {
      const res = await supabase
        .from("quandr3_options")
        .select("*")
        .eq("quandr3_id", qid)
        .order(col, { ascending: true });
      if (!res.error) return res.data ?? [];
    }

    // last resort: no order applied
    const res2 = await supabase.from("quandr3_options").select("*").eq("quandr3_id", qid);
    return res2.data ?? [];
  }

  async function refreshAll(qid: string) {
    // Core question
    const { data: qRow } = await supabase.from("quandr3s").select("*").eq("id", qid).single();
    setQ(qRow ?? null);

    // Creator profile (nice-to-have)
    const creatorId = getCreatorId(qRow);
    if (creatorId) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", creatorId)
        .single();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }

    // Options (robust)
    const opts = await fetchOptionsRobust(qid);
    setOptions(opts ?? []);

    // Votes
    const { data: v } = await supabase.from("quandr3_votes").select("*").eq("quandr3_id", qid);
    const vRows = v ?? [];
    setVotes(vRows);

    // Reasons
    if (vRows.length) {
      const voteIds = vRows.map((x: any) => x.id).filter(Boolean);
      const { data: rs } = await supabase.from("vote_reasons").select("vote_id, reason").in("vote_id", voteIds);

      const map: Record<string, string> = {};
      (rs ?? []).forEach((r: any) => {
        const txt = cleanReason(r.reason);
        if (txt) map[r.vote_id] = txt;
      });
      setReasonsByVoteId(map);
    } else {
      setReasonsByVoteId({});
    }

    // Resolution (may be blocked by RLS; still fine)
    const { data: r } = await supabase.from("quandr3_resolutions").select("*").eq("quandr3_id", qid).maybeSingle();
    setResolution(r ?? null);
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      await refreshAll(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const votingExpired = useMemo(() => {
    if (!q) return false;
    const duration = Number(q.voting_duration_hours || 0);
    const createdAt = q.created_at;

    const timeExpired =
      !!createdAt && !!duration
        ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000
        : false;

    const voteCapReached = q.voting_max_votes ? totalVotes >= Number(q.voting_max_votes) : false;

    return timeExpired || voteCapReached;
  }, [q, totalVotes]);

  // ✅ TRUST DB STATUS FIRST (your fix), then fallback if missing
  const status = useMemo(() => {
    const s = String(q?.status || "").toLowerCase();
    if (s === "open" || s === "awaiting_user" || s === "resolved") return s;
    if (resolution) return "resolved";
    if (votingExpired) return "awaiting_user";
    return "open";
  }, [q?.status, resolution, votingExpired]);

  const statusPill = useMemo(() => statusLabel(status as any), [status]);

  const voteCounts = useMemo(() => {
    const map: Record<number, number> = {};
    votes.forEach((v: any) => {
      const idx = normChoiceIndex(v.choice_index);
      if (!idx) return;
      map[idx] = (map[idx] || 0) + 1;
    });
    return map;
  }, [votes, zeroBasedVotes]);

  const winningOrder = useMemo(() => {
    // If resolution has option_id, use it
    if (resolution?.option_id) {
      const opt = options.find((o: any) => o.id === resolution.option_id);
      if (opt) return getOptOrder(opt, 1);
    }

    // Otherwise, highest votes
    let max = -1;
    let win: any = null;
    Object.entries(voteCounts).forEach(([k, v]: any) => {
      if (v > max) {
        max = v;
        win = Number(k);
      }
    });
    return win;
  }, [resolution, options, voteCounts]);

  // ✅ HERE’S THE FIX: show letter + the option label (when available)
  const leadingLabel = useMemo(() => {
    if (!winningOrder) return null;
    const opt = options.find((o: any, i: number) => getOptOrder(o, i + 1) === winningOrder);
    const letter = LETTER[winningOrder - 1] || `#${winningOrder}`;
    const label = opt ? safeStr(opt.label || opt.title || opt.text || opt.option_text) : "";
    return label ? `${letter} — ${label}` : `${letter}`;
  }, [winningOrder, options]);

  const reasonsByChoiceIndex = useMemo(() => {
    const grouped: Record<number, string[]> = {};
    votes.forEach((v: any) => {
      const txt = cleanReason(reasonsByVoteId[v.id]);
      if (!txt) return;
      const idx = normChoiceIndex(v.choice_index);
      if (!idx) return;
      grouped[idx] = grouped[idx] || [];
      grouped[idx].push(txt);
    });
    return grouped;
  }, [votes, reasonsByVoteId, zeroBasedVotes]);

  const heroImg = useMemo(() => {
    return q?.media_url ? q.media_url : heroForCategory(q?.category);
  }, [q]);

  const creatorName = useMemo(() => creatorLabel(q, profile), [q, profile]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Results…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling votes and reasons.</div>
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

  // Block results while open
  if (status === "open") {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
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
                  Back to Quandr3
                </div>
                <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">RESULTS LOCKED</div>
              </div>
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

        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[28px] border bg-white p-6 shadow-sm">
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold"
              style={{ background: statusPill.bg, color: statusPill.fg }}
            >
              {statusPill.label}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold" style={{ color: NAVY }}>
              Results unlock after voting closes
            </h1>
            <div className="mt-2 text-sm text-slate-600">Head back to the Quandr3 to vote while it’s open.</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/q/${id}`} className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE }}>
                Go vote
              </Link>
              <Link
                href="/explore"
                className="rounded-2xl border bg-white px-5 py-3 text-sm font-extrabold text-slate-800"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
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
          <Link href={`/q/${id}`} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
              <span className="text-lg" style={{ color: NAVY }}>
                ←
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Results
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">SEE HOW IT PLAYED OUT</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/explore" className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
              Explore
            </Link>
            <Link href="/q/create" className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE }}>
              Create a Quandr3
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="overflow-hidden rounded-[28px] border bg-white shadow-sm">
          <div className="relative h-[220px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b2343cc] via-[#0b234388] to-[#0b234320]" />

            <div className="absolute left-5 top-5 flex items-center gap-3">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                {safeStr(q.category || "Category")}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: statusPill.bg, color: statusPill.fg }}>
                {statusPill.label}
              </span>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex flex-wrap items-center gap-3 text-white/90">
                <span className="text-xs font-semibold">
                  {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-white/60">•</span>
                <span className="text-xs font-semibold">Created {fmt(q.created_at)}</span>
                <span className="text-xs text-white/60">•</span>
                <span className="text-xs font-semibold">
                  Posted by <span className="font-extrabold text-white">{creatorName}</span>
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white">{safeStr(q.title) || "Untitled Quandr3"}</h1>

              {safeStr(q.context) ? (
                <p className="mt-2 max-w-3xl text-sm text-white/90">{safeStr(q.context)}</p>
              ) : (
                <p className="mt-2 max-w-3xl text-sm text-white/80">No context provided.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">WHAT THIS MEANS</div>
              <div className="mt-2 text-sm text-slate-700">
                The crowd picked their path. The “why” behind votes is what makes Quandr3 valuable — it turns polling into shared wisdom.
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">TOP LINE</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                  Total votes: {totalVotes}
                </span>

                {leadingLabel ? (
                  <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: "rgba(0,169,165,0.12)", color: TEAL }}>
                    Leading: {leadingLabel}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                    No votes yet
                  </span>
                )}

                {resolution?.note ? (
                  <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: "rgba(30,99,243,0.12)", color: BLUE }}>
                    Curioso note included
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">RESULTS</div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                Vote breakdown
              </div>
              <div className="mt-1 text-sm text-slate-600">Percentages are based on total votes. Reasons are shown under each option.</div>
            </div>

            <button
              className="rounded-2xl border bg-white px-4 py-3 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
              onClick={() => setShowAllReasons((v) => !v)}
            >
              {showAllReasons ? "Show fewer reasons" : "Show more reasons"}
            </button>
          </div>

          {!options?.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              No options found for this Quandr3 yet.
              <div className="mt-2 text-xs text-slate-500">
                (If you DO have options in the DB, your options table probably uses a different sort column — this page now tries several, but if it still can’t find them, we’ll match your exact column name next.)
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {options.map((opt: any, i: number) => {
                const ord = getOptOrder(opt, i + 1);
                const count = voteCounts[ord] || 0;
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                const isWinner = ord === winningOrder;

                const reasons = reasonsByChoiceIndex[ord] ?? [];
                const reasonsToShow = showAllReasons ? reasons.slice(0, 20) : reasons.slice(0, 5);

                const label = safeStr(opt.label || opt.title || opt.text || opt.option_text) || `Option ${LETTER[ord - 1] ?? ord}`;

                return (
                  <div
                    key={opt.id ?? `${i}-${label}`}
                    className="rounded-[26px] border bg-white p-5 shadow-sm"
                    style={{ borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(15,23,42,0.12)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-extrabold text-white" style={{ background: isWinner ? TEAL : NAVY }}>
                            {LETTER[ord - 1] ?? ord}
                          </span>
                          <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                            {label}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          {count} vote{count === 1 ? "" : "s"} • {pct}%
                        </div>
                      </div>

                      {isWinner ? (
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700">Leading</span>
                      ) : (
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                          —
                        </span>
                      )}
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isWinner ? TEAL : BLUE }} />
                    </div>

                    <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-600">WHY PEOPLE CHOSE THIS</div>

                      {reasonsToShow.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-600">No reasons submitted yet.</div>
                      ) : (
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-800">
                          {reasonsToShow.map((txt: string, idx: number) => (
                            <li key={`${i}-why-${idx}`} className="leading-snug">
                              {txt}
                            </li>
                          ))}
                        </ul>
                      )}

                      {reasons.length > reasonsToShow.length ? (
                        <div className="mt-3 text-xs text-slate-500">
                          Showing {reasonsToShow.length} of {reasons.length} reasons.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {resolution ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">CURIOSO NOTE</div>
            <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
              Final word from the Curioso
            </div>

            <div className="mt-4 rounded-2xl border bg-slate-50 p-5">
              <div className="whitespace-pre-wrap text-sm text-slate-800">{resolution.note ? resolution.note : "No note was left for this resolution."}</div>
              <div className="mt-3 text-xs text-slate-600">
                Resolved on <span className="font-semibold">{fmt(resolution.created_at || resolution.resolved_at)}</span>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">Quandr3 • Ask • Share • Decide</div>
      </div>
    </main>
  );
}
