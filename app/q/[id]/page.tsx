// /app/q/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const ALLOWED = ["A", "B", "C", "D"];

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function safeStr(x: any) {
  return (x ?? "").toString();
}

function hoursLeftFromClosesAt(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function statusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "open") return { bg: "#e8f3ff", fg: BLUE, label: "open" };
  if (s === "awaiting_user") return { bg: "#fff4e6", fg: "#b45309", label: "internet decided" };
  if (s === "resolved") return { bg: "#ecfdf5", fg: "#059669", label: "resolved" };
  return { bg: "#f1f5f9", fg: "#334155", label: status || "unknown" };
}

function cleanLabel(x?: any) {
  const s = (x || "").toString().trim().toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function optText(o: any) {
  // ✅ your options table uses "value"
  return (o?.value ?? "").toString().trim();
}

function scrollToId(id: string) {
  try {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {}
}

export default function Quandr3DetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [opts, setOpts] = useState<any[]>([]);
  const [err, setErr] = useState<string>("");

  // ✅ Curioso (author) info
  const [author, setAuthor] = useState<any>(null);

  // auth (for author-only toggle)
  const [meId, setMeId] = useState("");

  // voting
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });
  const [myVote, setMyVote] = useState<string>("");
  const [myVoteRowId, setMyVoteRowId] = useState<string>("");
  const [casting, setCasting] = useState(false);

  // leader + tie (for “internet decided” box)
  const [leaderLabel, setLeaderLabel] = useState<string>("");
  const [leaderCount, setLeaderCount] = useState<number>(0);
  const [isTie, setIsTie] = useState<boolean>(false);

  // why
  const [whyText, setWhyText] = useState("");
  const [whySaving, setWhySaving] = useState(false);

  // messages
  const [votingMsg, setVotingMsg] = useState<string>("");
  const [votingErr, setVotingErr] = useState<string>("");

  // reasons shown on page
  const [reasonsByLabel, setReasonsByLabel] = useState<Record<string, string[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  // discussion toggle UX
  const [discSaving, setDiscSaving] = useState(false);
  const [discErr, setDiscErr] = useState("");

  // Phase-1 “Get informed” (localStorage)
  const [notifyOnResolve, setNotifyOnResolve] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");

  // Share UX
  const [shareMsg, setShareMsg] = useState("");

  const badge = useMemo(() => statusBadge(q?.status), [q?.status]);
  const hrsLeft = useMemo(() => hoursLeftFromClosesAt(q?.closes_at), [q?.closes_at]);

  const voteKey = useMemo(() => (id ? `q_vote_${id}` : ""), [id]);
  const voteRowKey = useMemo(() => (id ? `q_vote_row_${id}` : ""), [id]);
  const notifyKey = useMemo(() => (id ? `q_notify_resolve_${id}` : ""), [id]);

  // ✅ PATCH: Open is only "open" if status=open AND time is not up
  const isOpen = useMemo(() => {
    const st = (q?.status || "").toLowerCase();
    if (st !== "open") return false;

    const h = hoursLeftFromClosesAt(q?.closes_at);
    if (h !== null && h <= 0) return false;

    return true;
  }, [q?.status, q?.closes_at]);

  const isResolved = useMemo(() => (q?.status || "").toLowerCase() === "resolved", [q?.status]);
  const isAwaiting = useMemo(() => (q?.status || "").toLowerCase() === "awaiting_user", [q?.status]);

  const isAuthor = useMemo(() => {
    if (!meId || !q?.author_id) return false;
    return String(meId) === String(q.author_id);
  }, [meId, q?.author_id]);

  // ✅ Open should behave like open (guardrail if options missing)
  const openButNoOptions = useMemo(() => isOpen && (opts || []).length === 0, [isOpen, opts]);

  // totals for tiny vote bars
  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + (voteCounts?.[L] || 0), 0);
  }, [voteCounts]);

  function pct(label: string) {
    const v = voteCounts?.[label] || 0;
    if (!totalVotes) return 0;
    return Math.round((v / totalVotes) * 100);
  }

  const winnerLabel = useMemo(() => {
    if (!leaderLabel || !leaderCount) return "";
    if (isTie) return "";
    return leaderLabel;
  }, [leaderLabel, leaderCount, isTie]);

  const requiredCategoryMissing = useMemo(() => !safeStr(q?.category).trim(), [q?.category]);

  const curiosoName = useMemo(() => {
    const dn = safeStr(author?.display_name).trim();
    const un = safeStr(author?.username).trim();
    if (dn) return dn;
    if (un) return un;
    const aid = safeStr(q?.author_id);
    if (!aid) return "Curioso";
    return `${aid.slice(0, 6)}…${aid.slice(-4)}`;
  }, [author?.display_name, author?.username, q?.author_id]);

  const curiosoHref = useMemo(() => (q?.author_id ? `/u/${q.author_id}` : "#"), [q?.author_id]);

  // restore local vote + notify prefs
  useEffect(() => {
    if (!voteKey) return;
    try {
      const v = cleanLabel(localStorage.getItem(voteKey) || "");
      if (v) setMyVote(v);
      const rid = (localStorage.getItem(voteRowKey) || "").trim();
      if (rid) setMyVoteRowId(rid);
    } catch {}

    if (!notifyKey) return;
    try {
      const n = localStorage.getItem(notifyKey) === "1";
      setNotifyOnResolve(n);
    } catch {}
  }, [voteKey, voteRowKey, notifyKey]);

  async function loadMe() {
    try {
      const { data } = await supabase.auth.getUser();
      setMeId(data?.user?.id ? String(data.user.id) : "");
    } catch {
      setMeId("");
    }
  }

  async function loadCounts(qid: string) {
    const { data, error } = await supabase.from("quandr3_choices").select("label").eq("quandr3_id", qid);
    if (error) {
      console.warn("counts warning:", error);
      return;
    }

    const counts: any = { A: 0, B: 0, C: 0, D: 0 };
    (data || []).forEach((r: any) => {
      const lab = cleanLabel(r?.label);
      if (lab) counts[lab] = (counts[lab] || 0) + 1;
    });
    setVoteCounts(counts);

    // ✅ Determine leader (or tie)
    const entries = Object.entries(counts) as any[];
    const sorted = entries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
    const top = sorted[0];
    const second = sorted[1];

    const topLabel = top?.[0] || "";
    const topCount = top?.[1] || 0;
    const secondCount = second?.[1] || 0;

    if (!topCount) {
      setLeaderLabel("");
      setLeaderCount(0);
      setIsTie(false);
    } else {
      setLeaderLabel(topLabel);
      setLeaderCount(topCount);
      setIsTie(topCount === secondCount);
    }
  }

  async function loadReasons(qid: string) {
    const { data, error } = await supabase.from("quandr3_choices").select("label,text").eq("quandr3_id", qid);
    if (error) {
      console.warn("reasons warning:", error);
      return;
    }
    const grouped: any = { A: [], B: [], C: [], D: [] };
    (data || []).forEach((r: any) => {
      const lab = cleanLabel(r?.label);
      const t = (r?.text || "").toString().trim();
      if (lab && t) grouped[lab].push(t);
    });
    setReasonsByLabel(grouped);
  }

  async function loadAuthorProfile(authorId?: string) {
    if (!authorId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,role,city,state,location")
        .eq("id", authorId)
        .maybeSingle();

      if (!error) setAuthor(data || null);
    } catch {}
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      setVotingErr("");
      setVotingMsg("");
      setDiscErr("");
      setNotifyMsg("");
      setShareMsg("");

      try {
        await loadMe();

        const { data: qRow, error: qErr } = await supabase
          .from("quandr3s")
          .select(
            // ✅ include prompt, keep context for backward compat
            "id,title,prompt,context,category,status,created_at,closes_at,author_id,city,state,discussion_open,resolved_at,resolved_choice_label,resolution_note"
          )
          .eq("id", id)
          .single();

        if (qErr) throw qErr;

        const { data: oRows, error: oErr } = await supabase
          .from("quandr3_options")
          .select("id,quandr3_id,label,value,order,created_at,image_url")
          .eq("quandr3_id", id)
          .order("order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true });

        if (oErr) console.warn("Options load warning:", oErr);

        if (!alive) return;

        const cleaned = (oRows || [])
          .filter((r: any) => optText(r).length > 0)
          .filter((r: any) => !!cleanLabel(r?.label));

        setQ(qRow);
        setOpts(cleaned);

        await loadAuthorProfile(qRow?.author_id);
        await loadCounts(id);
        await loadReasons(id);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "Failed to load Quandr3.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);

  async function castVote(label: string) {
    setVotingErr("");
    setVotingMsg("");
    setNotifyMsg("");
    setShareMsg("");

    const L = cleanLabel(label);
    if (!L) return;

    if (myVote) {
      setVotingErr(`You already voted (${myVote}) on this device.`);
      return;
    }

    if (!isOpen) {
      setVotingErr("Votes are no longer accepted — this Quandr3 is closed.");
      return;
    }

    if (openButNoOptions) {
      setVotingErr("This Quandr3 is marked open, but no options are available yet.");
      return;
    }

    setCasting(true);
    try {
      const { data, error } = await supabase
        .from("quandr3_choices")
        .insert({
          quandr3_id: id,
          label: L,
          text: "",
        })
        .select("id")
        .single();

      if (error) throw error;

      const newRowId = data?.id ? String(data.id) : "";

      try {
        localStorage.setItem(voteKey, L);
        if (newRowId) localStorage.setItem(voteRowKey, newRowId);
      } catch {}

      setMyVote(L);
      setMyVoteRowId(newRowId);
      setVotingMsg(`Vote recorded: ${L}`);
      await loadCounts(id);
      await loadReasons(id);

      setTimeout(() => scrollToId("whybox"), 150);
    } catch (e: any) {
      console.error(e);
      setVotingErr(e?.message || "Vote failed.");
    } finally {
      setCasting(false);
    }
  }

  async function saveWhy() {
    setVotingErr("");
    setVotingMsg("");
    setNotifyMsg("");
    setShareMsg("");

    if (!myVote) {
      setVotingErr("Vote first, then add your reason.");
      return;
    }
    if (!myVoteRowId) {
      setVotingErr("Could not find your vote row id on this device. Re-vote on a fresh Quandr3, then save your reason.");
      return;
    }

    const txt = (whyText || "").toString().trim();
    if (!txt) {
      setVotingErr("Type 1–2 sentences for your reason, then save.");
      return;
    }

    setWhySaving(true);
    try {
      const { error } = await supabase.from("quandr3_choices").update({ text: txt }).eq("id", myVoteRowId);
      if (error) throw error;

      setVotingMsg("Reason saved. Thank you — the “why” is what creates clarity.");
      setWhyText("");
      await loadReasons(id);
      await loadCounts(id);
    } catch (e: any) {
      console.error(e);
      setVotingErr(e?.message || "Failed to save reason.");
    } finally {
      setWhySaving(false);
    }
  }

  async function toggleDiscussion() {
    setDiscErr("");
    if (!isAuthor) {
      setDiscErr("Only the author can open/close discussion.");
      return;
    }

    setDiscSaving(true);
    try {
      const nextVal = !Boolean(q?.discussion_open);
      const { error } = await supabase.from("quandr3s").update({ discussion_open: nextVal }).eq("id", id);
      if (error) throw error;
      setQ((prev: any) => ({ ...(prev || {}), discussion_open: nextVal }));
    } catch (e: any) {
      console.error(e);
      setDiscErr(e?.message || "Failed to toggle discussion.");
    } finally {
      setDiscSaving(false);
    }
  }

  function handleNotifyToggle() {
    setNotifyMsg("");
    setShareMsg("");
    const next = !notifyOnResolve;
    setNotifyOnResolve(next);
    try {
      localStorage.setItem(notifyKey, next ? "1" : "0");
    } catch {}
    setNotifyMsg(
      next
        ? "Got it — you’ll be informed when the Curioso posts the final resolution (Phase 1: saved on this device)."
        : "Removed."
    );
  }

  async function handleShare() {
    setShareMsg("");
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const title = safeStr(q?.title).trim() || "Quandr3";
      const text = "See the options + the reasons behind the internet’s choice.";

      // native share when available
      if (navigator?.share) {
        await navigator.share({ title, text, url });
        setShareMsg("Shared.");
        return;
      }

      // fallback: copy link
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied.");
        return;
      }

      // last fallback
      setShareMsg(url ? `Copy this link: ${url}` : "Copy link from address bar.");
    } catch {
      setShareMsg("Could not share. Copy link from address bar.");
    }
  }

  // Banner content (the “gentle hand”)
  const banner = useMemo(() => {
    if (isOpen) {
      return {
        bg: "#eaf6ff",
        border: "#cfe8ff",
        title: "Help someone decide.",
        body: "Pick A–D. If you can, add a quick reason — that’s where the clarity comes from.",
        ctaId: "vote",
        ctaText: "Jump to voting",
        showNotify: false,
      };
    }

    if (isAwaiting) {
      const decidedLine =
        leaderLabel && !isTie
          ? `Winner: ${leaderLabel}. The internet has decided (${leaderCount} vote${leaderCount === 1 ? "" : "s"}).`
          : leaderLabel && isTie
          ? "It’s a tie — the internet is split right now."
          : "Voting is closed.";

      return {
        bg: "#fff5e8",
        border: "#fde6c8",
        title: "Votes are no longer accepted — this Quandr3 is closed.",
        body: `${decidedLine} Waiting for the Curioso to decide. Check below for details and the “why” behind each choice.`,
        ctaId: "results",
        ctaText: "See results & reasons",
        showNotify: false,
      };
    }

    if (isResolved) {
      return {
        bg: "#ecfdf5",
        border: "#bbf7d0",
        title: "Resolution posted.",
        body: "Scroll down to see what the Curioso decided — plus the reasons behind the internet’s choice.",
        ctaId: "final",
        ctaText: "View final resolution",
        showNotify: false,
      };
    }

    return {
      bg: "#f1f5f9",
      border: "#e2e8f0",
      title: "This Quandr3 is not accepting votes.",
      body: "Scroll down to see results and reasoning.",
      ctaId: "results",
      ctaText: "See results",
      showNotify: true,
    };
  }, [isOpen, isAwaiting, isResolved, leaderLabel, leaderCount, isTie]);

  function VoteBar({ label, emphasize }: { label: string; emphasize?: boolean }) {
    const v = voteCounts?.[label] || 0;
    const p = pct(label);
    const filled = totalVotes ? `${Math.min(100, Math.max(0, p))}%` : "0%";

    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{totalVotes ? `${p}%` : "—"}</span>
          <span>
            {v} vote{v === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-1 h-2 w-full rounded-full border bg-white" style={{ borderColor: emphasize ? CORAL : "#e2e8f0" }}>
          <div
            className="h-2 rounded-full"
            style={{
              width: filled,
              background: emphasize ? CORAL : NAVY,
              opacity: totalVotes ? 0.95 : 0.2,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
              style={{ color: NAVY }}
            >
              ← Back to Explore
            </Link>

            <div className="text-xs font-bold text-slate-500">
              {id ? (
                <>
                  <span className="font-extrabold" style={{ color: NAVY }}>
                    /q/
                  </span>
                  {String(id).slice(0, 6)}…{String(id).slice(-4)}
                </>
              ) : null}
            </div>
          </div>

          <Link
            href="/q/create"
            className="rounded-full px-5 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
            style={{ background: BLUE }}
          >
            Create a Quandr3
          </Link>
        </div>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="text-slate-600">Loading…</div>
          ) : err ? (
            <div className="text-red-600 font-semibold">{err}</div>
          ) : !q ? (
            <div className="text-slate-600">Not found.</div>
          ) : (
            <>
              {/* ✅ Category is mandatory */}
              <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                {requiredCategoryMissing ? (
                  <span className="rounded-full border px-3 py-1" style={{ borderColor: "#fecaca", color: "#b91c1c", background: "#fef2f2" }}>
                    CATEGORY REQUIRED
                  </span>
                ) : (
                  safeStr(q.category).toUpperCase()
                )}
              </div>

              <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl" style={{ color: NAVY }}>
                {q.title}
              </h1>

              {/* prompt-first, context fallback */}
              {(q.prompt || q.context) ? <p className="mt-3 text-base text-slate-700">{q.prompt || q.context}</p> : null}

              {/* ✅ Category requirement callout */}
              {requiredCategoryMissing ? (
                <div className="mt-4 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
                  This Quandr3 is missing a category. Category is mandatory for resolved posts.
                </div>
              ) : null}

              {/* Dynamic banner */}
              <div className="mt-6 rounded-2xl border p-5" style={{ background: banner.bg, borderColor: banner.border }}>
                <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                  {banner.title}
                </div>
                <div className="mt-1 text-sm text-slate-700">{banner.body}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToId(banner.ctaId)}
                    className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                    style={{ background: NAVY }}
                  >
                    {banner.ctaText}
                  </button>

                  {banner.showNotify ? (
                    <button
                      type="button"
                      onClick={handleNotifyToggle}
                      className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                      style={{ color: NAVY }}
                      title="Phase 1: saved on this device"
                    >
                      {notifyOnResolve ? "✅ You’ll be informed" : "Get informed when resolution posts"}
                    </button>
                  ) : null}

                  {/* ✅ Share button (required on resolved) */}
                  {(isResolved || isAwaiting) ? (
                    <button
                      type="button"
                      onClick={handleShare}
                      className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                      style={{ color: NAVY }}
                      title="Share this resolved Quandr3"
                    >
                      Share
                    </button>
                  ) : null}
                </div>

                {notifyMsg ? (
                  <div className="mt-2 text-xs font-semibold" style={{ color: TEAL }}>
                    {notifyMsg}
                  </div>
                ) : null}

                {shareMsg ? (
                  <div className="mt-2 text-xs font-semibold" style={{ color: TEAL }}>
                    {shareMsg}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: badge.bg, color: badge.fg }}>
                  {badge.label}
                </span>

                <span className="text-slate-400">•</span>
                <span>
                  <span className="font-semibold">Posted:</span> {fmt(q.created_at)}
                </span>

                {q.closes_at ? (
                  <>
                    <span className="text-slate-400">•</span>
                    <span>
                      <span className="font-semibold">Closes:</span> {fmt(q.closes_at)}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center gap-2">
                      ⏳ <span className="font-semibold">{hrsLeft ?? 0}</span> hour(s) left
                    </span>
                  </>
                ) : null}

                {/* ✅ include city/state (locked) */}
                {(q.city || q.state) ? (
                  <>
                    <span className="text-slate-400">•</span>
                    <span>
                      {q.city ? q.city : ""}
                      {q.city && q.state ? ", " : ""}
                      {q.state ? q.state : ""}
                    </span>
                  </>
                ) : null}
              </div>

              {/* ✅ Curioso link (required) + display name */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={curiosoHref}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                  style={{ color: NAVY }}
                >
                  View Curioso
                </Link>

                <div className="text-sm text-slate-600">
                  Curioso: <span className="font-extrabold" style={{ color: NAVY }}>{curiosoName}</span>
                </div>

                <div className="text-sm text-slate-600">
                  ID:{" "}
                  <span className="font-mono text-slate-800">
                    {String(q.author_id || "").slice(0, 6)}…{String(q.author_id || "").slice(-4)}
                  </span>
                </div>
              </div>

              {/* ✅ Approved resolved layout: Internet Decided + Curioso Verdict */}
              {(isResolved || isAwaiting) ? (
                <div id="final" className="mt-8 space-y-4">
                  {/* INTERNET DECIDED (for awaiting_user AND resolved) */}
                  <div className="rounded-2xl border p-5" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
                    <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">INTERNET DECIDED</div>

                    <div className="mt-2 text-sm text-slate-700">
                      {winnerLabel ? (
                        <>
                          <span className="font-extrabold" style={{ color: NAVY }}>
                            Top voted:
                          </span>{" "}
                          <span className="font-extrabold" style={{ color: CORAL }}>
                            {winnerLabel}
                          </span>{" "}
                          ({leaderCount} vote{leaderCount === 1 ? "" : "s"} • {pct(winnerLabel)}% • {totalVotes} total)
                        </>
                      ) : leaderLabel && isTie ? (
                        <>It’s a tie — the internet is split.</>
                      ) : (
                        <>No votes yet.</>
                      )}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      This is the crowd outcome. The <span className="font-extrabold" style={{ color: NAVY }}>Curioso Verdict</span> is the official final decision.
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToId("results")}
                        className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                        style={{ background: NAVY }}
                      >
                        View reasons
                      </button>

                      {isAwaiting ? (
                        <button
                          type="button"
                          onClick={handleNotifyToggle}
                          className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                          style={{ color: NAVY }}
                          title="Phase 1: saved on this device"
                        >
                          {notifyOnResolve ? "✅ You’ll be informed" : "Get informed when Curioso resolves"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* CURIOSO VERDICT (resolved only) */}
                  {isResolved ? (
                    <div className="rounded-2xl border p-5" style={{ borderColor: "#c7d2fe", background: "#ffffff" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">CURIOSO VERDICT</div>
                          <div className="mt-2 text-sm font-extrabold" style={{ color: NAVY }}>
                            Final decision: {cleanLabel(q.resolved_choice_label) || "—"}
                          </div>
                        </div>

                        <div className="text-xs text-slate-500">Resolved: {q.resolved_at ? fmt(q.resolved_at) : "—"}</div>
                      </div>

                      {/* ✅ Curioso context (locked): show situation + city/state */}
                      <div className="mt-4 rounded-2xl border p-4 text-sm text-slate-700">
                        <div className="text-xs font-extrabold tracking-[0.2em] text-slate-500">CURIOSO CONTEXT</div>
                        <div className="mt-2">
                          {(q.prompt || q.context) ? (
                            <div className="text-slate-700">{q.prompt || q.context}</div>
                          ) : (
                            <div className="text-slate-600">No context provided.</div>
                          )}
                        </div>

                        {(q.city || q.state) ? (
                          <div className="mt-3 text-xs font-bold text-slate-500">
                            Location:{" "}
                            <span className="font-extrabold" style={{ color: NAVY }}>
                              {q.city ? q.city : ""}
                              {q.city && q.state ? ", " : ""}
                              {q.state ? q.state : ""}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-2xl border p-4 text-sm text-slate-700">
                        {(q.resolution_note || "").toString().trim() ? q.resolution_note : "No resolution note yet."}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: "#ecfeff", color: TEAL }}>
                          Discussion: {q.discussion_open ? "Open" : "Closed"}
                        </span>

                        {isAuthor ? (
                          <button
                            type="button"
                            onClick={toggleDiscussion}
                            disabled={discSaving}
                            className="rounded-full px-3 py-1 text-xs font-extrabold text-white disabled:opacity-60"
                            style={{ background: q.discussion_open ? NAVY : BLUE }}
                          >
                            {discSaving ? "Saving…" : q.discussion_open ? "Close Discussion" : "Open Discussion"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleShare}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-extrabold hover:bg-slate-50"
                          style={{ color: NAVY }}
                        >
                          Share
                        </button>
                      </div>

                      {discErr ? <div className="mt-2 text-sm font-semibold text-red-600">{discErr}</div> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Voting section */}
              <div id="vote" className="mt-8 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    Voting (A–D)
                  </div>
                  <div className="text-xs text-slate-500">{isOpen ? "Tap an option to vote." : "Votes are closed."}</div>
                </div>

                {!isOpen ? <div className="mt-2 text-sm text-slate-700 font-semibold">Votes are no longer accepted for this Quandr3.</div> : null}

                {openButNoOptions ? (
                  <div className="mt-3 rounded-2xl border p-4 text-sm text-amber-700 bg-amber-50">
                    This Quandr3 is marked open, but the options haven’t been added yet.
                    <div className="mt-1 text-xs text-slate-600">(Setup issue — not your fault.)</div>
                  </div>
                ) : null}

                {myVote ? (
                  <div className="mt-2 text-sm font-semibold" style={{ color: TEAL }}>
                    You voted: {myVote}
                  </div>
                ) : null}

                {myVote && isOpen ? (
                  <div id="whybox" className="mt-4 rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                        Why did you choose {myVote}?
                      </div>
                      <div className="text-xs text-slate-500">1–2 sentences is perfect.</div>
                    </div>

                    <textarea
                      value={whyText}
                      onChange={(e) => setWhyText(e.target.value)}
                      placeholder="Example: It’s the most practical choice, and it fits the situation best."
                      className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none"
                      rows={4}
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={saveWhy}
                        disabled={whySaving}
                        className="rounded-full px-5 py-2 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-60"
                        style={{ background: NAVY }}
                      >
                        {whySaving ? "Saving…" : "Save my reason"}
                      </button>
                      <div className="text-xs text-slate-500">Your “why” helps the author understand the internet’s thinking.</div>
                    </div>
                  </div>
                ) : null}

                {votingMsg ? (
                  <div className="mt-3 text-sm font-semibold" style={{ color: TEAL }}>
                    {votingMsg}
                  </div>
                ) : null}

                {votingErr ? <div className="mt-3 text-sm font-semibold text-red-600">{votingErr}</div> : null}
              </div>

              {/* Options + tiny vote bars */}
              <div className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">OPTIONS (A–D)</div>
                  <div className="text-xs text-slate-500">
                    {totalVotes ? (
                      <>
                        <span className="font-semibold">{totalVotes}</span> total vote{totalVotes === 1 ? "" : "s"}
                      </>
                    ) : (
                      <>No votes yet.</>
                    )}
                  </div>
                </div>

                {openButNoOptions ? (
                  <div className="mt-3 rounded-2xl border p-4 text-sm text-amber-700 bg-amber-50">
                    This Quandr3 is open, but the options haven’t been added yet.
                    <div className="mt-1 text-xs text-slate-600">(Setup issue — not your fault.)</div>
                  </div>
                ) : opts.length === 0 ? (
                  <div className="mt-3 text-slate-600">
                    No options found on this Quandr3.
                    <div className="mt-2 text-xs text-slate-500">
                      (This page reads from <span className="font-mono">quandr3_options.value</span>.)
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    {opts.map((o: any, idx: number) => {
                      const label = cleanLabel(o.label);
                      const value = optText(o);
                      const orderNum = typeof o.order === "number" ? o.order : idx + 1;
                      const votes = voteCounts[label] || 0;

                      const disabled = casting || !!myVote || !isOpen || openButNoOptions;
                      const isWinner = !!winnerLabel && label === winnerLabel;

                      return (
                        <button
                          key={o.id || idx}
                          type="button"
                          disabled={disabled}
                          onClick={() => castVote(label)}
                          className="w-full rounded-2xl border p-4 text-left hover:bg-slate-50 disabled:opacity-60"
                          style={{
                            borderColor: isWinner ? CORAL : undefined,
                            boxShadow: isWinner ? "0 0 0 2px rgba(255,107,107,0.18) inset" : undefined,
                            background: isWinner ? "#fff7f7" : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-extrabold tracking-[0.18em] text-slate-500">{label}</div>
                              {isWinner ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                                  style={{ background: "#ffe4e6", color: "#be123c" }}
                                >
                                  WINNER
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs font-bold text-slate-400">#{orderNum}</div>
                          </div>

                          <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>

                          <VoteBar label={label} emphasize={isWinner} />

                          <div className="mt-2 text-xs text-slate-500">
                            Votes: <span className="font-semibold">{votes}</span>
                            {!isOpen ? <span className="ml-2">• voting closed</span> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reasons */}
              <div id="results" className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">WHY PEOPLE CHOSE…</div>
                  {winnerLabel ? (
                    <div className="text-xs font-bold" style={{ color: CORAL }}>
                      Winner: {winnerLabel}
                    </div>
                  ) : isTie ? (
                    <div className="text-xs font-bold text-slate-500">Tie</div>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ALLOWED.map((L) => {
                    const list = reasonsByLabel[L] || [];
                    const isWinner = !!winnerLabel && L === winnerLabel;

                    return (
                      <div
                        key={L}
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: isWinner ? CORAL : undefined,
                          background: isWinner ? "#fff7f7" : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                              Why people chose {L}
                            </div>
                            {isWinner ? (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                                style={{ background: "#ffe4e6", color: "#be123c" }}
                              >
                                WINNER
                              </span>
                            ) : null}
                          </div>

                          <div className="text-xs font-bold text-slate-500">{totalVotes ? `${pct(L)}%` : "—"}</div>
                        </div>

                        <div className="mt-2">
                          <div className="h-2 w-full rounded-full border bg-white" style={{ borderColor: isWinner ? CORAL : "#e2e8f0" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: totalVotes ? `${pct(L)}%` : "0%",
                                background: isWinner ? CORAL : NAVY,
                                opacity: totalVotes ? 0.7 : 0.2,
                              }}
                            />
                          </div>
                        </div>

                        {list.length === 0 ? (
                          <div className="mt-3 text-sm text-slate-600">No reasons yet.</div>
                        ) : (
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {list.slice(0, 12).map((t, i) => (
                              <li key={`${L}-${i}`}>{t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  If votes exist but you can’t see them here, it’s almost always an RLS/select policy on{" "}
                  <span className="font-mono">quandr3_choices</span>.
                </div>
              </div>
            </>
          )}
        </section>

        <div className="mt-6 text-center text-xs text-slate-500">
          Quandr3: <span className="font-semibold">Ask.</span> <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </main>
  );
}
