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

const ALLOWED = ["A", "B", "C", "D"];

const CATEGORY_HERO: Record<string, string> = {
  money: "/quandr3/placeholders/money.jpg",
  career: "/quandr3/placeholders/career.jpg",
  relationships: "/quandr3/placeholders/relationships.jpg",
  health: "/quandr3/placeholders/health.jpg",
  family: "/quandr3/placeholders/family.jpg",
  tech: "/quandr3/placeholders/tech.jpg",
  style: "/quandr3/placeholders/style.jpg",
  lifestyle: "/quandr3/placeholders/lifestyle.jpg",
  faith: "/quandr3/placeholders/default.jpg",
  school: "/quandr3/placeholders/default.jpg",
  "real estate": "/quandr3/placeholders/realestate.jpg",
  realestate: "/quandr3/placeholders/realestate.jpg",
};

function heroForCategory(category?: string) {
  const key = safeStr(category).toLowerCase();
  return CATEGORY_HERO[key] || "/quandr3/placeholders/default.jpg";
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts || "";
  }
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cleanLabel(x?: any) {
  const s = safeStr(x).toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function cleanReason(s?: string) {
  const t = safeStr(s);
  if (!t) return "";
  if (t.toUpperCase() === "UPDATED TEXT HERE") return "";
  return t;
}

function getCreatorId(qRow: any) {
  return qRow?.author_id || qRow?.user_id || null;
}

function creatorLabel(qRow: any, profile: any) {
  if (profile?.display_name) return profile.display_name;
  if (profile?.username) return profile.username;
  const cid = getCreatorId(qRow);
  if (cid) return `Curioso ${String(cid).slice(0, 6)}`;
  return "Curioso";
}

function statusLabel(kind: "open" | "awaiting_user" | "resolved") {
  if (kind === "open") return { bg: "rgba(30,99,243,0.12)", fg: BLUE, label: "Open" };
  if (kind === "awaiting_user") {
    return { bg: "rgba(255,107,107,0.12)", fg: CORAL, label: "Internet Decided" };
  }
  return { bg: "rgba(0,169,165,0.12)", fg: TEAL, label: "Resolved" };
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
  const [choices, setChoices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showAllReasons, setShowAllReasons] = useState(false);

  async function refreshAll(qid: string) {
    const { data: qRow, error: qErr } = await supabase
      .from("quandr3s")
      .select(
        "id,title,prompt,context,category,status,created_at,closes_at,author_id,user_id,city,state,resolved_choice_label,resolved_at,resolution_note,media_url"
      )
      .eq("id", qid)
      .single();

    if (qErr) {
      setQ(null);
      setOptions([]);
      setChoices([]);
      setProfile(null);
      return;
    }

    setQ(qRow ?? null);

    const creatorId = getCreatorId(qRow);
    if (creatorId) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", creatorId)
        .maybeSingle();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }

    const { data: optRows, error: optErr } = await supabase
      .from("quandr3_options")
      .select("id,quandr3_id,label,value,text,order,created_at,image_url")
      .eq("quandr3_id", qid)
      .order("order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    setOptions(optErr ? [] : optRows ?? []);

    const { data: cRows, error: cErr } = await supabase
      .from("quandr3_choices")
      .select("id,quandr3_id,voter_id,label,text,created_at")
      .eq("quandr3_id", qid)
      .order("created_at", { ascending: true });

    setChoices(cErr ? [] : cRows ?? []);
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      await refreshAll(id);
      setLoading(false);
    })();
  }, [id]);

  const votingExpired = useMemo(() => {
    if (!q?.closes_at) return false;
    const closesAt = new Date(q.closes_at).getTime();
    if (Number.isNaN(closesAt)) return false;
    return closesAt <= Date.now();
  }, [q?.closes_at]);

  const hasResolution = useMemo(() => {
    return !!(
      q?.resolved_at ||
      cleanLabel(q?.resolved_choice_label) ||
      safeStr(q?.resolution_note)
    );
  }, [q?.resolved_at, q?.resolved_choice_label, q?.resolution_note]);

  const status = useMemo(() => {
    const s = safeStr(q?.status).toLowerCase();
    if (hasResolution || s === "resolved") return "resolved";
    if (s === "awaiting_user" || s === "closed" || votingExpired) return "awaiting_user";
    return "open";
  }, [q?.status, hasResolution, votingExpired]);

  const statusPill = useMemo(() => statusLabel(status as any), [status]);

  const orderedOptions = useMemo(() => {
    const arr = [...(options ?? [])]
      .map((o: any, i: number) => ({
        ...o,
        label: cleanLabel(o?.label),
        _ord: typeof o?.order === "number" ? o.order : i + 1,
      }))
      .filter((o: any) => !!o.label);

    arr.sort((a: any, b: any) => {
      if (a._ord !== b._ord) return a._ord - b._ord;
      return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    });

    return arr;
  }, [options]);

  const voteCounts = useMemo(() => {
    const map: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    (choices || []).forEach((v: any) => {
      const L = cleanLabel(v?.label);
      if (!L) return;
      map[L] = (map[L] || 0) + 1;
    });
    return map;
  }, [choices]);

  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + Number(voteCounts?.[L] || 0), 0);
  }, [voteCounts]);

  const reasonsByLabel = useMemo(() => {
    const grouped: Record<string, string[]> = { A: [], B: [], C: [], D: [] };
    (choices || []).forEach((r: any) => {
      const L = cleanLabel(r?.label);
      const txt = cleanReason(r?.text);
      if (!L || !txt) return;
      grouped[L] = grouped[L] || [];
      grouped[L].push(txt);
    });
    return grouped;
  }, [choices]);

  const crowdResult = useMemo(() => {
    const entries = ALLOWED.map((L) => ({ label: L, votes: Number(voteCounts?.[L] || 0) })).sort(
      (a, b) => b.votes - a.votes
    );

    const top = entries[0];
    const second = entries[1];

    if (!top || top.votes <= 0) {
      return { label: "", isTie: false, tied: [] as string[] };
    }

    if (top.votes === Number(second?.votes || 0)) {
      const tied = entries.filter((x) => x.votes === top.votes).map((x) => x.label);
      return { label: "", isTie: true, tied };
    }

    return { label: top.label, isTie: false, tied: [] as string[] };
  }, [voteCounts]);

  const crowdWinnerLabel = useMemo(() => crowdResult.label, [crowdResult]);

  const crowdWinnerOpt = useMemo(() => {
    if (!crowdWinnerLabel) return null;
    return orderedOptions.find((o: any) => cleanLabel(o?.label) === crowdWinnerLabel) ?? null;
  }, [orderedOptions, crowdWinnerLabel]);

  const curiosoFinalLabel = useMemo(() => cleanLabel(q?.resolved_choice_label), [q?.resolved_choice_label]);

  const curiosoFinalOpt = useMemo(() => {
    if (!curiosoFinalLabel) return null;
    return orderedOptions.find((o: any) => cleanLabel(o?.label) === curiosoFinalLabel) ?? null;
  }, [orderedOptions, curiosoFinalLabel]);

  const heroImg = useMemo(() => {
    return q?.media_url ? q.media_url : heroForCategory(q?.category);
  }, [q]);

  const creatorName = useMemo(() => creatorLabel(q, profile), [q, profile]);

  function optionDisplayText(opt: any) {
    return (
      safeStr(opt?.text || opt?.value || opt?.label || opt?.option_text) ||
      `Option ${cleanLabel(opt?.label) || "?"}`
    );
  }

  function percentageFor(label: string) {
    if (!totalVotes) return 0;
    return Math.round((Number(voteCounts?.[label] || 0) / totalVotes) * 100);
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Results…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling votes, options, and reasons.</div>
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
            <div className="mt-2 text-sm text-slate-600">
              That Quandr3 ID doesn’t exist, or the page could not load it.
            </div>
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
                <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                  RESULTS LOCKED
                </div>
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
            <div className="mt-2 text-sm text-slate-600">
              Head back to the Quandr3 to vote while it’s open.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/q/${id}`}
                className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm"
                style={{ background: BLUE }}
              >
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
              href="/explore"
              className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
            >
              Explore
            </Link>
            <Link
              href="/q/create"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              Create a Quandr3
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="overflow-hidden rounded-[28px] border bg-white shadow-sm">
          <div className="relative h-[220px] w-full">
            <img src={heroImg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b2343cc] via-[#0b234388] to-[#0b234320]" />

            <div className="absolute left-5 top-5 flex items-center gap-3">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                {safeStr(q.category || "Category")}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-extrabold"
                style={{ background: statusPill.bg, color: statusPill.fg }}
              >
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

              <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white">
                {safeStr(q.title) || "Untitled Quandr3"}
              </h1>

              {safeStr(q.prompt || q.context) ? (
                <p className="mt-2 max-w-3xl text-sm text-white/90">
                  {safeStr(q.prompt || q.context)}
                </p>
              ) : (
                <p className="mt-2 max-w-3xl text-sm text-white/80">No context provided.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">WHAT THIS MEANS</div>
              <div className="mt-2 text-sm text-slate-700">
                The crowd voted. The “why” behind votes is what makes Quandr3 valuable — it turns polling into shared wisdom.
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">TOP LINE</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                  Total votes: {totalVotes}
                </span>

                {crowdResult.isTie ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                  >
                    Crowd tied: {crowdResult.tied.join(" / ")}
                  </span>
                ) : crowdWinnerOpt ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                  >
                    Crowd winner: {cleanLabel(crowdWinnerOpt.label)} — {optionDisplayText(crowdWinnerOpt)}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold" style={{ color: NAVY }}>
                    No votes yet
                  </span>
                )}

                {status === "resolved" && curiosoFinalOpt ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                  >
                    Curioso chose: {cleanLabel(curiosoFinalOpt.label)} — {optionDisplayText(curiosoFinalOpt)}
                  </span>
                ) : null}

                {safeStr(q?.resolution_note) ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                  >
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
              <div className="mt-1 text-sm text-slate-600">
                Percentages are based on total votes. Reasons show under each option.
              </div>
            </div>

            <button
              className="rounded-2xl border bg-white px-4 py-3 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
              onClick={() => setShowAllReasons((v) => !v)}
            >
              {showAllReasons ? "Show fewer reasons" : "Show more reasons"}
            </button>
          </div>

          {!orderedOptions?.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              No options found for this Quandr3.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {orderedOptions.map((opt: any, i: number) => {
                const label = cleanLabel(opt?.label);
                const count = Number(voteCounts[label] || 0);
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

                const isCrowdWinner = !crowdResult.isTie && crowdWinnerLabel === label;
                const isTiedWinner = crowdResult.isTie && crowdResult.tied.includes(label);
                const isCuriosoChoice = !!curiosoFinalLabel && curiosoFinalLabel === label;
                const isHighlighted = isCrowdWinner || isCuriosoChoice || isTiedWinner;
                const isBoth = (isCrowdWinner || isTiedWinner) && isCuriosoChoice;

                const reasons = reasonsByLabel[label] ?? [];
                const reasonsToShow = showAllReasons ? reasons.slice(0, 20) : reasons.slice(0, 5);

                return (
                  <div
                    key={opt.id ?? `${i}-${label}`}
                    className="rounded-[26px] border p-5 shadow-sm"
                    style={{
                      background: isHighlighted ? "#fff5f5" : "white",
                      borderColor: isHighlighted ? "rgba(255,107,107,0.55)" : "rgba(15,23,42,0.12)",
                      boxShadow: isBoth ? "0 0 0 2px rgba(255,107,107,0.14) inset" : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
                            style={{ background: isHighlighted ? CORAL : NAVY }}
                          >
                            {label || "?"}
                          </span>
                          <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                            {optionDisplayText(opt)}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-600">
                          {count} vote{count === 1 ? "" : "s"} • {pct}%
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {isCrowdWinner ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-extrabold"
                              style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                            >
                              Crowd winner
                            </span>
                          ) : null}

                          {isTiedWinner ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-extrabold"
                              style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                            >
                              Crowd tied
                            </span>
                          ) : null}

                          {isCuriosoChoice ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-extrabold"
                              style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                            >
                              Curioso chose
                            </span>
                          ) : null}

                          {isBoth ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-extrabold"
                              style={{ background: NAVY, color: "white" }}
                            >
                              Match
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: isHighlighted ? CORAL : BLUE }}
                      />
                    </div>

                    <div
                      className="mt-4 rounded-2xl border p-4"
                      style={{
                        background: isHighlighted ? "#fff0f0" : "#f8fafc",
                        borderColor: isHighlighted ? "rgba(255,107,107,0.18)" : "rgba(15,23,42,0.08)",
                      }}
                    >
                      <div
                        className="text-xs font-semibold tracking-widest"
                        style={{ color: isHighlighted ? CORAL : "#475569" }}
                      >
                        WHY PEOPLE CHOSE THIS
                      </div>

                      {reasonsToShow.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-600">No reasons submitted yet.</div>
                      ) : (
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-800">
                          {reasonsToShow.map((txt: string, idx: number) => (
                            <li key={`${opt.id}-why-${idx}`} className="leading-snug">
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

        {status === "resolved" ? (
          <section
            className="mt-7 rounded-[28px] border p-6 shadow-sm"
            style={{
              background: "#fff5f5",
              borderColor: "rgba(255,107,107,0.35)",
            }}
          >
            <div className="text-xs font-semibold tracking-widest" style={{ color: CORAL }}>
              CURIOSO NOTE
            </div>
            <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
              Final word from the Curioso
            </div>

            {curiosoFinalOpt ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                >
                  Final choice: {cleanLabel(curiosoFinalOpt.label)} — {optionDisplayText(curiosoFinalOpt)}
                </span>
              </div>
            ) : null}

            <div
              className="mt-4 rounded-2xl border p-5"
              style={{
                background: "#fff0f0",
                borderColor: "rgba(255,107,107,0.18)",
              }}
            >
              <div className="whitespace-pre-wrap text-sm text-slate-800">
                {safeStr(q?.resolution_note) || "No note was left for this resolution."}
              </div>
              <div className="mt-3 text-xs text-slate-600">
                Resolved on <span className="font-semibold">{fmt(q?.resolved_at)}</span>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">Quandr3 • Ask • Share • Decide</div>
      </div>
    </main>
  );
}