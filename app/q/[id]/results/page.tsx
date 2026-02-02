// app/q/[id]/results/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function ConfettiBurst({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    if (!fire) return;

    const colors = [NAVY, TEAL, CORAL, BLUE, "#ffffff"];
    const count = 160; // don't spare it 🙂
    const now = Date.now();

    const next = Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100; // vw
      const drift = (Math.random() * 2 - 1) * 35; // vw
      const rot = Math.random() * 720;
      const delay = Math.random() * 0.25;
      const dur = 2.1 + Math.random() * 0.9;
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = Math.random() > 0.55 ? "rect" : "dot";
      return {
        id: `${now}-${i}`,
        left,
        drift,
        rot,
        delay,
        dur,
        size,
        color,
        shape,
      };
    });

    setPieces(next);

    const t = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(t);
  }, [fire]);

  if (!pieces.length) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti ${p.shape === "dot" ? "dot" : "rect"}`}
          style={{
            left: `${p.left}vw`,
            background: p.color,
            width: `${p.size}px`,
            height: p.shape === "dot" ? `${p.size}px` : `${Math.max(6, p.size * 0.6)}px`,
            borderRadius: p.shape === "dot" ? "999px" : "6px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `translate3d(0, -10vh, 0) rotate(${p.rot}deg)`,
            // custom props via CSS vars
            ["--drift" as any]: `${p.drift}vw`,
          }}
        />
      ))}

      <style jsx>{`
        .confetti {
          position: absolute;
          top: 0;
          opacity: 0.95;
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.12));
          animation-name: confettiFall;
          animation-timing-function: cubic-bezier(0.2, 0.75, 0.25, 1);
          animation-fill-mode: forwards;
          will-change: transform, opacity;
        }

        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -12vh, 0) rotate(0deg);
            opacity: 0.98;
          }
          70% {
            opacity: 0.98;
          }
          100% {
            transform: translate3d(var(--drift), 115vh, 0) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function Quandr3ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);

  const [fireConfetti, setFireConfetti] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    // local "auth" (matches your current pattern in TopNav)
    try {
      const stored = localStorage.getItem("quandr3-user");
      if (stored) setMe(JSON.parse(stored));
    } catch {}
  }, []);

  async function loadAll() {
    if (!id) return;

    setLoading(true);

    // 1) Load Quandr3
    const qRes = await supabase
      .from("quandr3s")
      .select("*")
      .eq("id", id)
      .single();

    if (qRes?.error) {
      console.error(qRes.error);
      setQ(null);
      setLoading(false);
      return;
    }

    const qq = qRes.data;
    setQ(qq);

    // Redirect if still open (State A)
    if (qq?.status === "open") {
      router.replace(`/q/${id}`);
      return;
    }

    // 2) Load options
    const optRes = await supabase
      .from("quandr3_options")
      .select("*")
      .eq("quandr3_id", id)
      .order("created_at", { ascending: true });

    if (optRes?.error) console.error(optRes.error);
    setOptions(optRes?.data || []);

    // 3) Load votes
    // Expecting votes table with either option_id or picked_index.
    const voteRes = await supabase
      .from("quandr3_votes")
      .select("*")
      .eq("quandr3_id", id);

    if (voteRes?.error) console.error(voteRes.error);
    setVotes(voteRes?.data || []);

    // 4) Load vote reasons (if available)
    const reasonRes = await supabase
      .from("vote_reasons")
      .select("*")
      .eq("quandr3_id", id)
      .order("created_at", { ascending: false });

    if (reasonRes?.error) console.error(reasonRes.error);
    setReasons(reasonRes?.data || []);

    // 5) Load resolution (if resolved)
    // Expecting table: quandr3_resolutions (as per your build notes)
    const resoRes = await supabase
      .from("quandr3_resolutions")
      .select("*")
      .eq("quandr3_id", id)
      .order("resolved_at", { ascending: false })
      .limit(1);

    if (resoRes?.error) console.error(resoRes.error);
    const reso = (resoRes?.data && resoRes.data[0]) || null;
    setResolution(reso);

    setLoading(false);

    // Confetti: only for the "awaiting_user" preview moment
    if (qq?.status === "awaiting_user") {
      setFireConfetti(true);
      // ensure it never re-fires on state changes
      setTimeout(() => setFireConfetti(false), 3500);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isCurioso = useMemo(() => {
    if (!q || !me) return false;
    const myId = me?.id || me?.user_id || me?.uid;
    return (
      myId &&
      (q?.user_id === myId ||
        q?.creator_id === myId ||
        q?.created_by === myId)
    );
  }, [q, me]);

  const optionStats = useMemo(() => {
    const opts = options || [];
    const v = votes || [];

    // Build index map
    const byOptionId: Record<string, number> = {};
    const byPickedIndex: Record<number, number> = {};
    let total = 0;

    for (const vote of v) {
      // support both schemas
      const option_id = vote?.option_id || vote?.quandr3_option_id;
      const pickedIndex =
        vote?.picked_index ?? vote?.pickedIndex ?? vote?.picked;

      if (option_id) {
        byOptionId[option_id] = (byOptionId[option_id] || 0) + 1;
        total += 1;
      } else if (pickedIndex !== undefined && pickedIndex !== null) {
        const idx = safeNum(pickedIndex);
        byPickedIndex[idx] = (byPickedIndex[idx] || 0) + 1;
        total += 1;
      } else {
        // unknown vote row shape; ignore
      }
    }

    const rows = opts.map((opt: any, idx: number) => {
      const count =
        (opt?.id && byOptionId[opt.id]) ||
        byPickedIndex[idx] ||
        0;
      const pct = total ? Math.round((count / total) * 100) : 0;
      const imageUrl =
        opt?.image_url ||
        opt?.image ||
        opt?.option_image_url ||
        opt?.photo_url ||
        "";
      const label =
        opt?.label ||
        opt?.text ||
        opt?.title ||
        opt?.option_text ||
        `Option ${String.fromCharCode(65 + idx)}`;

      return {
        idx,
        id: opt?.id,
        label,
        imageUrl,
        count,
        pct,
      };
    });

    // Determine winner:
    // If resolved, prefer the resolution's picked index/option id.
    let winnerIdx = 0;

    if (q?.status === "resolved") {
      if (resolution?.picked_index !== undefined && resolution?.picked_index !== null) {
        winnerIdx = safeNum(resolution.picked_index);
      } else if (resolution?.option_id) {
        const found = rows.find((r) => r.id === resolution.option_id);
        if (found) winnerIdx = found.idx;
      } else if (resolution?.quandr3_option_id) {
        const found = rows.find((r) => r.id === resolution.quandr3_option_id);
        if (found) winnerIdx = found.idx;
      } else {
        // fall back to max vote
        winnerIdx = rows.reduce((best, r) => (r.count > rows[best].count ? r.idx : best), 0);
      }
    } else {
      // awaiting_user: max vote
      winnerIdx = rows.reduce((best, r) => (r.count > rows[best].count ? r.idx : best), 0);
    }

    return { rows, total, winnerIdx };
  }, [options, votes, q, resolution]);

  const reasonsByOption = useMemo(() => {
    const map: Record<string, string[]> = {};

    // Helper to resolve reason -> option
    const resolveKey = (r: any) => {
      const option_id = r?.option_id || r?.quandr3_option_id;
      const pickedIndex = r?.picked_index ?? r?.pickedIndex ?? r?.picked;
      if (option_id) return `id:${option_id}`;
      if (pickedIndex !== undefined && pickedIndex !== null) return `idx:${safeNum(pickedIndex)}`;
      return "unknown";
    };

    for (const r of reasons || []) {
      const key = resolveKey(r);
      const text =
        (typeof r?.reason === "string" && r.reason.trim()) ||
        (typeof r?.text === "string" && r.text.trim()) ||
        (typeof r?.note === "string" && r.note.trim()) ||
        "";

      if (!text) continue;

      if (!map[key]) map[key] = [];
      // keep unique-ish
      if (!map[key].includes(text)) map[key].push(text);
    }

    // cap each option list a bit to keep it readable
    for (const k of Object.keys(map)) {
      map[k] = map[k].slice(0, 8);
    }

    return map;
  }, [reasons]);

  const winner = useMemo(() => {
    const w = optionStats.rows?.find((r) => r.idx === optionStats.winnerIdx);
    return w || optionStats.rows?.[0] || null;
  }, [optionStats]);

  const statusLabel = useMemo(() => {
    if (!q?.status) return "";
    if (q.status === "awaiting_user") return "Results Preview";
    if (q.status === "resolved") return "Decision Made";
    return q.status;
  }, [q]);

  const statusColor = useMemo(() => {
    if (q?.status === "awaiting_user") return TEAL;
    if (q?.status === "resolved") return CORAL;
    return BLUE;
  }, [q]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-9 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold" style={{ color: NAVY }}>
              Couldn’t load this Quandr3
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              It may have been removed or the link is incorrect.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: BLUE }}
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionText = q?.question || q?.title || q?.prompt || "Quandr3";

  return (
    <div className="min-h-screen" style={{ background: SOFT_BG }}>
      <ConfettiBurst fire={fireConfetti} />

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: statusColor }}
              >
                {q?.status === "resolved" ? "✅ " : q?.status === "awaiting_user" ? "🎉 " : ""}
                {statusLabel}
              </span>
              <span className="text-xs text-gray-600">
                Created: {formatDate(q?.created_at)}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: NAVY }}>
              {q?.status === "awaiting_user" ? "The community has spoken." : "Final results."}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {q?.status === "awaiting_user"
                ? "Here’s how people leaned — and why."
                : "This Quandr3 is closed. The decision is locked in."}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/q/${id}`}
              className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
              style={{ color: NAVY }}
            >
              View Quandr3
            </Link>
            <Link
              href="/q/create"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create New
            </Link>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                The Question
              </div>
              <div className="mt-2 text-lg font-bold leading-snug" style={{ color: NAVY }}>
                {questionText}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Total votes: <span className="font-semibold">{optionStats.total}</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div
                className="rounded-2xl px-4 py-3 text-right"
                style={{
                  background: "linear-gradient(135deg, rgba(30,99,243,0.08), rgba(0,169,165,0.10), rgba(255,107,107,0.10))",
                  border: "1px solid rgba(11,35,67,0.08)",
                }}
              >
                <div className="text-xs font-semibold" style={{ color: NAVY }}>
                  Ask. Share. Decide.
                </div>
                <div className="mt-1 text-[11px] text-gray-600">
                  Quandr3 turns opinions into clarity.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Hero */}
        {winner && (
          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
              <div className="relative w-full overflow-hidden rounded-2xl border bg-gray-50 md:w-[340px]">
                {winner.imageUrl ? (
                  <img
                    src={winner.imageUrl}
                    alt={winner.label}
                    className="h-56 w-full object-cover md:h-56"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center text-sm text-gray-500">
                    No image
                  </div>
                )}

                <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-sm">
                  <span>👑</span>
                  <span style={{ color: NAVY }}>Leading Choice</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {q?.status === "resolved" ? "Final Choice" : "Top Result"}
                </div>

                <div className="mt-2 text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
                  {winner.label}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-bold text-white"
                    style={{ background: TEAL }}
                  >
                    {winner.pct}% ({winner.count})
                  </div>
                  <div className="text-sm text-gray-600">
                    out of {optionStats.total} vote{optionStats.total === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${winner.pct}%`,
                        background: "linear-gradient(90deg, rgba(0,169,165,1), rgba(30,99,243,1))",
                      }}
                    />
                  </div>
                </div>

                {q?.status === "resolved" && (
                  <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Curioso’s Note
                    </div>
                    <div className="mt-2 text-sm leading-relaxed" style={{ color: NAVY }}>
                      {resolution?.note || resolution?.resolution_note || q?.resolution_note || "—"}
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Resolved: {formatDate(resolution?.resolved_at || q?.resolved_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Results */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Full Breakdown
              </div>
              <div className="mt-1 text-lg font-bold" style={{ color: NAVY }}>
                How the votes split
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Winner: <span className="font-semibold">{winner?.label || "—"}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {optionStats.rows.map((r) => {
              const isWinner = r.idx === optionStats.winnerIdx;
              return (
                <div
                  key={r.id || r.idx}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(11,35,67,0.10)",
                    boxShadow: isWinner ? "0 8px 30px rgba(0,169,165,0.12)" : "none",
                  }}
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-20 overflow-hidden rounded-xl border bg-gray-50">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.label} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-extrabold leading-snug" style={{ color: NAVY }}>
                          {r.label}
                        </div>
                        {isWinner && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            👑 Leading
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{r.count} vote{r.count === 1 ? "" : "s"}</span>
                          <span className="font-semibold">{r.pct}%</span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${r.pct}%`,
                              background: isWinner
                                ? "linear-gradient(90deg, rgba(0,169,165,1), rgba(255,107,107,1))"
                                : "linear-gradient(90deg, rgba(30,99,243,1), rgba(0,169,165,1))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick reason teaser */}
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Why people chose this
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {(() => {
                        const keyById = r.id ? `id:${r.id}` : "";
                        const keyByIdx = `idx:${r.idx}`;
                        const list = (keyById && reasonsByOption[keyById]) || reasonsByOption[keyByIdx] || [];
                        const show = list.slice(0, 3);
                        if (!show.length) {
                          return <li className="text-gray-500">No reasons submitted yet.</li>;
                        }
                        return show.map((t, i) => <li key={i}>{t}</li>);
                      })()}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep Reasons (Grouped) */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reasoning
          </div>
          <div className="mt-1 text-lg font-bold" style={{ color: NAVY }}>
            Why people voted the way they did
          </div>
          <p className="mt-1 text-sm text-gray-600">
            This is the wisdom layer — the “why” behind the numbers.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {optionStats.rows.map((r) => {
              const keyById = r.id ? `id:${r.id}` : "";
              const keyByIdx = `idx:${r.idx}`;
              const list = (keyById && reasonsByOption[keyById]) || reasonsByOption[keyByIdx] || [];
              const isWinner = r.idx === optionStats.winnerIdx;

              return (
                <div
                  key={`reasons-${r.id || r.idx}`}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: isWinner ? "rgba(255,107,107,0.45)" : "rgba(11,35,67,0.10)",
                    background: isWinner ? "rgba(255,107,107,0.04)" : "white",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-extrabold" style={{ color: NAVY }}>
                      {r.label}
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      {list.length ? `${list.length} reason${list.length === 1 ? "" : "s"}` : "—"}
                    </div>
                  </div>

                  <div className="mt-3 max-h-48 overflow-auto rounded-xl bg-gray-50 p-3">
                    {list.length ? (
                      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800">
                        {list.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No reasons submitted for this option yet.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curioso CTA (awaiting_user only) */}
        {q?.status === "awaiting_user" && (
          <div className="sticky bottom-3 mt-6">
            <div
              className="rounded-2xl border bg-white p-4 shadow-lg"
              style={{ borderColor: "rgba(0,169,165,0.35)" }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    Ready to decide?
                  </div>
                  <div className="text-xs text-gray-600">
                    Lock your outcome and close the loop.
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/q/${id}`}
                    className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
                    style={{ color: NAVY }}
                  >
                    Back
                  </Link>

                  {isCurioso ? (
                    <button
                      onClick={() => router.push(`/q/${id}/resolve`)}
                      className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-extrabold text-white shadow-sm"
                      style={{ background: "linear-gradient(90deg, rgba(0,169,165,1), rgba(30,99,243,1))" }}
                    >
                      Resolve This Quandr3
                    </button>
                  ) : (
                    <div
                      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                      style={{ background: "rgba(11,35,67,0.06)", color: NAVY }}
                      title="Only the Curioso can resolve this Quandr3."
                    >
                      Waiting on Curioso
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer nudge */}
        <div className="mt-10 text-center text-xs text-gray-600">
          Quandr3 keeps it simple: <span className="font-semibold">Ask.</span> <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </div>
  );
}
