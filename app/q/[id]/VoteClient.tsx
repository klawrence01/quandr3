// /app/q/[id]/VoteClient.tsx
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

// Curioso / action-state colors
const ACTION_BG = "#f3e8ff";
const ACTION_BORDER = "#c084fc";
const ACTION_TEXT = "#581c87";
const ACTION_BUTTON = "#7c3aed";
const ACTION_BUTTON_ALT = "#f59e0b";

const ALLOWED = ["A", "B", "C", "D"];
const FOLLOWS_TABLE = "dilemma_follows";

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts || "";
  }
}

function safeStr(x: any) {
  return (x ?? "").toString();
}

function cleanLabel(x?: any) {
  const s = safeStr(x).trim().toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function optText(o: any) {
  const t = safeStr(o?.text).trim();
  if (t) return t;
  return safeStr(o?.value).trim();
}

function hoursLeftFromClosesAt(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function scrollToId(id: string) {
  try {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch {}
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function VoteClient({
  serverUserId = "",
}: {
  serverUserId?: string;
}) {
  const params = useParams();
  const id = safeStr((params as any)?.id);

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [opts, setOpts] = useState<any[]>([]);
  const [author, setAuthor] = useState<any>(null);
  const [meId, setMeId] = useState(serverUserId || "");
  const [err, setErr] = useState("");

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  });

  const [reasonsByLabel, setReasonsByLabel] = useState<Record<string, string[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [myVote, setMyVote] = useState("");
  const [myVoteRowId, setMyVoteRowId] = useState("");
  const [casting, setCasting] = useState(false);
  const [whyText, setWhyText] = useState("");
  const [whySaving, setWhySaving] = useState(false);

  const [leaderLabel, setLeaderLabel] = useState("");
  const [leaderCount, setLeaderCount] = useState(0);
  const [isTie, setIsTie] = useState(false);

  const [votingMsg, setVotingMsg] = useState("");
  const [votingErr, setVotingErr] = useState("");
  const [notifyOnResolve, setNotifyOnResolve] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const [discSaving, setDiscSaving] = useState(false);
  const [discErr, setDiscErr] = useState("");

  const hrsLeft = useMemo(() => hoursLeftFromClosesAt(q?.closes_at), [q?.closes_at]);

  const votingExpired = useMemo(() => {
    if (!q?.closes_at) return false;
    const closesAt = new Date(q.closes_at).getTime();
    if (Number.isNaN(closesAt)) return false;
    return closesAt <= Date.now();
  }, [q?.closes_at]);

  const viewerId = useMemo(() => safeStr(meId).trim().toLowerCase(), [meId]);

  const ownerId = useMemo(() => {
    return safeStr(q?.author_id || q?.user_id || author?.id).trim().toLowerCase();
  }, [q?.author_id, q?.user_id, author?.id]);

  const isAuthor = useMemo(() => {
    return !!viewerId && !!ownerId && viewerId === ownerId;
  }, [viewerId, ownerId]);

  const hasResolution = useMemo(() => {
    return !!(
      q?.resolved_at ||
      cleanLabel(q?.resolved_choice_label) ||
      safeStr(q?.resolution_note).trim()
    );
  }, [q?.resolved_at, q?.resolved_choice_label, q?.resolution_note]);

  const uiState = useMemo(() => {
    if (hasResolution) return "resolved";
    if (votingExpired) return isAuthor ? "owner_needs_resolution" : "awaiting_curioso";
    return "open";
  }, [hasResolution, votingExpired, isAuthor]);

  const isOpen = uiState === "open";
  const isAwaiting = uiState === "awaiting_curioso";
  const isAwaitingLike =
    uiState === "awaiting_curioso" || uiState === "owner_needs_resolution";
  const isResolved = uiState === "resolved";

  const badge = useMemo(() => {
    if (uiState === "resolved") {
      return { bg: "#ecfdf5", fg: "#059669", label: "resolved" };
    }
    if (uiState === "owner_needs_resolution" || uiState === "awaiting_curioso") {
      return { bg: "#fff4e6", fg: "#b45309", label: "internet decided" };
    }
    return { bg: "#e8f3ff", fg: BLUE, label: "open" };
  }, [uiState]);

  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + Number(voteCounts?.[L] || 0), 0);
  }, [voteCounts]);

  const leadingLabel = useMemo(() => {
    if (!leaderLabel || !leaderCount || isTie || !isOpen) return "";
    return leaderLabel;
  }, [leaderLabel, leaderCount, isTie, isOpen]);

  const closedWinnerLabel = useMemo(() => {
    if (!leaderLabel || !leaderCount || isTie || !isAwaitingLike) return "";
    return leaderLabel;
  }, [leaderLabel, leaderCount, isTie, isAwaitingLike]);

  const requiredCategoryMissing = useMemo(
    () => !safeStr(q?.category).trim(),
    [q?.category]
  );

  const openButNoOptions = useMemo(() => isOpen && opts.length === 0, [isOpen, opts]);

  const curiosoName = useMemo(() => {
    const dn = safeStr(author?.display_name).trim();
    const un = safeStr(author?.username).trim();
    if (dn) return dn;
    if (un) return un;
    const aid = safeStr(q?.author_id || q?.user_id);
    if (!aid) return "Curioso";
    return `${aid.slice(0, 6)}…${aid.slice(-4)}`;
  }, [author?.display_name, author?.username, q?.author_id, q?.user_id]);

  const curiosoHref = useMemo(() => {
    const aid = q?.author_id || q?.user_id;
    return aid ? `/u/${aid}` : "#";
  }, [q?.author_id, q?.user_id]);

  const notifyKey = useMemo(() => (id ? `q_notify_resolve_${id}` : ""), [id]);

  function pct(label: string) {
    const v = Number(voteCounts?.[label] || 0);
    if (!totalVotes) return 0;
    return Math.round((v / totalVotes) * 100);
  }

  function clearMessages() {
    setVotingErr("");
    setVotingMsg("");
    setNotifyMsg("");
    setShareMsg("");
  }

  async function loadMe() {
    // Prefer server-provided user id first
    if (serverUserId) return serverUserId;

    // Browser fallback
    for (let i = 0; i < 5; i++) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData?.session?.user?.id
          ? String(sessionData.session.user.id)
          : "";
        if (sessionUserId) return sessionUserId;
      } catch {}

      try {
        const { data: userData } = await supabase.auth.getUser();
        const directUserId = userData?.user?.id ? String(userData.user.id) : "";
        if (directUserId) return directUserId;
      } catch {}

      if (i < 4) await sleep(300);
    }

    return "";
  }

  async function loadQuestion(qid: string) {
    const { data, error } = await supabase
      .from("quandr3s")
      .select(
        "id,title,prompt,context,category,status,created_at,closes_at,author_id,user_id,city,state,discussion_open,resolved_at,resolved_choice_label,resolution_note"
      )
      .eq("id", qid)
      .single();

    if (error) throw error;
    return data;
  }

  async function loadOptions(qid: string) {
    const { data, error } = await supabase
      .from("quandr3_options")
      .select("id,quandr3_id,label,value,text,order,created_at,image_url")
      .eq("quandr3_id", qid)
      .order("order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Options load warning:", error);
      return [];
    }

    return (data || [])
      .filter((r: any) => optText(r).length > 0)
      .filter((r: any) => !!cleanLabel(r?.label));
  }

  async function loadAuthorProfile(authorId?: string) {
    if (!authorId) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,role,city,state,location")
      .eq("id", authorId)
      .maybeSingle();

    if (error) {
      console.warn("author profile warning:", error);
      return null;
    }

    return data || null;
  }

  async function loadVoteCounts(qid: string) {
    const { data, error } = await supabase
      .from("quandr3_choices")
      .select("label")
      .eq("quandr3_id", qid);

    if (error) {
      console.warn("counts warning:", error);
      return {
        counts: { A: 0, B: 0, C: 0, D: 0 },
        leader: "",
        leaderCount: 0,
        tie: false,
      };
    }

    const counts: any = { A: 0, B: 0, C: 0, D: 0 };
    (data || []).forEach((r: any) => {
      const lab = cleanLabel(r?.label);
      if (lab) counts[lab] = Number(counts[lab] || 0) + 1;
    });

    const entries = Object.entries(counts).sort(
      (a: any, b: any) => Number(b[1]) - Number(a[1])
    );

    const top = entries[0];
    const second = entries[1];

    const topLabel = safeStr(top?.[0]);
    const topCount = Number(top?.[1] || 0);
    const secondCount = Number(second?.[1] || 0);

    return {
      counts,
      leader: topCount ? topLabel : "",
      leaderCount: topCount,
      tie: topCount > 0 && topCount === secondCount,
    };
  }

  async function loadReasons(qid: string) {
    const { data, error } = await supabase
      .from("quandr3_choices")
      .select("label,text")
      .eq("quandr3_id", qid);

    if (error) {
      console.warn("reasons warning:", error);
      return { A: [], B: [], C: [], D: [] };
    }

    const grouped: any = { A: [], B: [], C: [], D: [] };
    (data || []).forEach((r: any) => {
      const lab = cleanLabel(r?.label);
      const t = safeStr(r?.text).trim();
      if (lab && t) grouped[lab].push(t);
    });

    return grouped;
  }

  async function loadMyVote(qid: string, userId: string) {
    if (!userId) return { label: "", rowId: "" };

    const { data, error } = await supabase
      .from("quandr3_choices")
      .select("id,label")
      .eq("quandr3_id", qid)
      .eq("voter_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("loadMyVote warning:", error);
      return { label: "", rowId: "" };
    }

    return {
      label: cleanLabel(data?.label),
      rowId: data?.id ? String(data.id) : "",
    };
  }

  useEffect(() => {
    if (!notifyKey) return;
    try {
      setNotifyOnResolve(localStorage.getItem(notifyKey) === "1");
    } catch {}
  }, [notifyKey]);

  useEffect(() => {
    let alive = true;

    async function hydrateViewer() {
      const uid = await loadMe();
      if (!alive) return "";
      setMeId(uid || "");
      return uid || "";
    }

    async function loadAll() {
      setLoading(true);
      setErr("");
      setVotingErr("");
      setVotingMsg("");
      setDiscErr("");
      setNotifyMsg("");
      setShareMsg("");

      try {
        const qRow = await loadQuestion(id);

        if (
          qRow?.status === "open" &&
          qRow?.closes_at &&
          new Date(qRow.closes_at).getTime() <= Date.now() &&
          !qRow?.resolved_at &&
          !qRow?.resolved_choice_label &&
          !safeStr(qRow?.resolution_note).trim()
        ) {
          const { error: transitionError } = await supabase
            .from("quandr3s")
            .update({ status: "awaiting_user" })
            .eq("id", id);

          if (!transitionError) {
            qRow.status = "awaiting_user";
          } else {
            console.warn("status transition warning:", transitionError);
          }
        }

        const authorId = qRow?.author_id || qRow?.user_id || "";
        const uid = await hydrateViewer();

        const [optRows, profileRow, countsRes, reasonsRes, myVoteRes] = await Promise.all([
          loadOptions(id),
          loadAuthorProfile(authorId),
          loadVoteCounts(id),
          loadReasons(id),
          loadMyVote(id, uid || ""),
        ]);

        if (!alive) return;

        setQ(qRow);
        setOpts(optRows);
        setAuthor(profileRow);
        setVoteCounts(countsRes.counts);
        setLeaderLabel(countsRes.leader);
        setLeaderCount(countsRes.leaderCount);
        setIsTie(countsRes.tie);
        setReasonsByLabel(reasonsRes);
        setMyVote(myVoteRes.label);
        setMyVoteRowId(myVoteRes.rowId);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "Failed to load Quandr3.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    async function syncSession() {
      try {
        const uid = await loadMe();
        if (!alive) return;
        setMeId(uid || "");
      } catch {}
    }

    if (id) loadAll();
    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      const uid = session?.user?.id ? String(session.user.id) : await loadMe();
      if (!alive) return;
      setMeId(uid || "");
    });

    return () => {
      alive = false;
      subscription?.unsubscribe?.();
    };
  }, [id, serverUserId]);

  async function refreshCountsAndReasons() {
    const [countsRes, reasonsRes] = await Promise.all([
      loadVoteCounts(id),
      loadReasons(id),
    ]);

    setVoteCounts(countsRes.counts);
    setLeaderLabel(countsRes.leader);
    setLeaderCount(countsRes.leaderCount);
    setIsTie(countsRes.tie);
    setReasonsByLabel(reasonsRes);
  }

  async function followThisDilemmaIfLoggedIn(quandr3Id: string) {
    try {
      let uid = meId;
      if (!uid) uid = await loadMe();
      if (!uid) return;

      const { error } = await supabase
        .from(FOLLOWS_TABLE)
        .upsert(
          { user_id: uid, quandr3_id: quandr3Id },
          { onConflict: "user_id,quandr3_id" }
        );

      if (error) console.warn("[follow] upsert failed:", error);
    } catch (e) {
      console.warn("[follow] could not follow dilemma", e);
    }
  }

  async function castVote(label: string) {
    clearMessages();

    const L = cleanLabel(label);
    if (!L) return;

    if (isAuthor) {
      setVotingErr("You cannot vote on your own Quandr3.");
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
      const uid = await loadMe();
      if (!uid) {
        setVotingErr("You must be signed in to vote.");
        return;
      }

      const existing = await loadMyVote(id, uid);
      if (existing.rowId) {
        setMyVote(existing.label);
        setMyVoteRowId(existing.rowId);
        setVotingErr(`You already voted${existing.label ? ` (${existing.label})` : ""}.`);
        return;
      }

      const { data, error } = await supabase
        .from("quandr3_choices")
        .insert({
          quandr3_id: id,
          voter_id: uid,
          label: L,
          text: "",
        })
        .select("id")
        .single();

      if (error) throw error;

      const newRowId = data?.id ? String(data.id) : "";
      setMyVote(L);
      setMyVoteRowId(newRowId);
      setVotingMsg(`Vote recorded: ${L}`);

      await followThisDilemmaIfLoggedIn(id);
      await refreshCountsAndReasons();

      setTimeout(() => scrollToId("whybox"), 150);
    } catch (e: any) {
      console.error(e);
      setVotingErr(e?.message || "Vote failed.");
    } finally {
      setCasting(false);
    }
  }

  async function saveWhy() {
    clearMessages();

    if (!myVote) {
      setVotingErr("Vote first, then add your reason.");
      return;
    }

    const txt = safeStr(whyText).trim();
    if (!txt) {
      setVotingErr("Type 1–2 sentences for your reason, then save.");
      return;
    }

    setWhySaving(true);
    try {
      const uid = await loadMe();
      if (!uid) {
        setVotingErr("You must be signed in.");
        return;
      }

      const { error } = await supabase
        .from("quandr3_choices")
        .update({ text: txt })
        .eq("quandr3_id", id)
        .eq("voter_id", uid);

      if (error) throw error;

      setVotingMsg("Reason saved. Thank you — the “why” is what creates clarity.");
      setWhyText("");
      await refreshCountsAndReasons();
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
      const { error } = await supabase
        .from("quandr3s")
        .update({ discussion_open: nextVal })
        .eq("id", id);

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

      if (navigator?.share) {
        await navigator.share({ title, text, url });
        setShareMsg("Shared.");
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied.");
        return;
      }

      setShareMsg(url ? `Copy this link: ${url}` : "Copy link from address bar.");
    } catch {
      setShareMsg("Could not share. Copy link from address bar.");
    }
  }

  const banner = useMemo(() => {
    if (isAuthor && isOpen) {
      return {
        bg: "#fff5e8",
        border: "#fde6c8",
        title: "Your Quandr3 is gathering input.",
        body:
          "Voting is open right now. Let the community weigh in. When voting ends, come back to review the results and post your final resolution.",
        ctaId: "results",
        ctaText: "View voting progress",
        ctaBg: NAVY,
        showNotify: false,
      };
    }

    if (!isAuthor && isOpen) {
      return {
        bg: "#eaf6ff",
        border: "#cfe8ff",
        title: "Help someone decide.",
        body: "Pick A–D. If you can, add a quick reason — that’s where the clarity comes from.",
        ctaId: "vote",
        ctaText: "Jump to voting",
        ctaBg: NAVY,
        showNotify: false,
      };
    }

    if (isAuthor && isAwaitingLike) {
      const decidedLine =
        leaderLabel && !isTie
          ? `Winner: ${leaderLabel}. The internet has decided (${leaderCount} vote${leaderCount === 1 ? "" : "s"}).`
          : leaderLabel && isTie
          ? "It’s a tie — the internet is split right now."
          : "Voting is closed.";

      return {
        bg: ACTION_BG,
        border: ACTION_BORDER,
        title: "⚡ Your Quandr3 is waiting on you.",
        body: `${decidedLine} This is your moment to close the loop. Review the results, then post your final resolution so everyone can learn what you decided.`,
        ctaId: "results",
        ctaText: "Review results now",
        ctaBg: ACTION_BUTTON,
        showNotify: false,
      };
    }

    if (!isAuthor && isAwaitingLike) {
      const decidedLine =
        leaderLabel && !isTie
          ? `Winner: ${leaderLabel}. The internet has decided (${leaderCount} vote${leaderCount === 1 ? "" : "s"}).`
          : leaderLabel && isTie
          ? "It’s a tie — the internet is split right now."
          : "Voting is closed.";

      return {
        bg: "#fff5e8",
        border: "#fde6c8",
        title: "Voting is closed. Waiting for the Curioso to decide.",
        body: `${decidedLine} Check below for details and the “why” behind each choice.`,
        ctaId: "results",
        ctaText: "See results & reasons",
        ctaBg: NAVY,
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
        ctaBg: NAVY,
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
      ctaBg: NAVY,
      showNotify: true,
    };
  }, [isAuthor, isOpen, isAwaitingLike, isResolved, leaderLabel, leaderCount, isTie]);

  function VoteBar({ label, emphasize }: { label: string; emphasize?: boolean }) {
    const v = Number(voteCounts?.[label] || 0);
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

        <div
          className="mt-1 h-2 w-full rounded-full border bg-white"
          style={{ borderColor: emphasize ? CORAL : "#e2e8f0" }}
        >
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

          <div className="flex flex-wrap items-center gap-2">
            {(isAwaitingLike || isResolved) && id ? (
              <Link
                href={`/q/${id}/results`}
                className="rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                style={{ background: CORAL }}
              >
                View Results
              </Link>
            ) : null}

            {isAuthor && isAwaitingLike && id ? (
              <Link
                href={`/q/${id}/resolve`}
                className="rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                style={{ background: ACTION_BUTTON }}
              >
                Resolve Quandr3
              </Link>
            ) : null}

            <Link
              href="/q/create"
              className="rounded-full px-5 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
              style={{ background: BLUE }}
            >
              Create a Quandr3
            </Link>
          </div>
        </div>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="text-slate-600">Loading…</div>
          ) : err ? (
            <div className="font-semibold text-red-600">{err}</div>
          ) : !q ? (
            <div className="text-slate-600">Not found.</div>
          ) : (
            <>
              <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                {requiredCategoryMissing ? (
                  <span
                    className="rounded-full border px-3 py-1"
                    style={{
                      borderColor: "#fecaca",
                      color: "#b91c1c",
                      background: "#fef2f2",
                    }}
                  >
                    CATEGORY REQUIRED
                  </span>
                ) : (
                  safeStr(q.category).toUpperCase()
                )}
              </div>

              <h1
                className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl"
                style={{ color: NAVY }}
              >
                {q.title}
              </h1>

              {(q.prompt || q.context) ? (
                <p className="mt-3 text-base text-slate-700">{q.prompt || q.context}</p>
              ) : null}

              {requiredCategoryMissing ? (
                <div
                  className="mt-4 rounded-2xl border p-4 text-sm font-semibold"
                  style={{
                    borderColor: "#fecaca",
                    background: "#fef2f2",
                    color: "#991b1b",
                  }}
                >
                  This Quandr3 is missing a category. Category is mandatory for resolved posts.
                </div>
              ) : null}

              <div
                className="mb-4 mt-4 rounded-2xl border p-3 text-xs"
                style={{
                  borderColor: "#fecaca",
                  background: "#fff7f7",
                  color: NAVY,
                }}
              >
                <div className="font-extrabold">DEBUG</div>
                <div>viewerId: {viewerId || "null"}</div>
                <div>ownerId: {ownerId || "null"}</div>
                <div>isAuthor: {String(isAuthor)}</div>
                <div>votingExpired: {String(votingExpired)}</div>
                <div>hasResolution: {String(hasResolution)}</div>
                <div>uiState: {uiState}</div>
                <div>status: {q?.status || "null"}</div>
                <div>closes_at: {q?.closes_at || "null"}</div>
              </div>

              <div
                className="mt-6 rounded-2xl border p-5"
                style={{ background: banner.bg, borderColor: banner.border }}
              >
                <div
                  className="text-sm font-extrabold"
                  style={{ color: isAuthor && isAwaitingLike ? ACTION_TEXT : NAVY }}
                >
                  {banner.title}
                </div>

                <div
                  className="mt-1 text-sm"
                  style={{ color: isAuthor && isAwaitingLike ? ACTION_TEXT : "#334155" }}
                >
                  {banner.body}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToId(banner.ctaId)}
                    className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                    style={{ background: banner.ctaBg }}
                  >
                    {banner.ctaText}
                  </button>

                  {isAuthor && isAwaitingLike && id ? (
                    <Link
                      href={`/q/${id}/resolve`}
                      className="rounded-full px-4 py-2 text-sm font-extrabold text-slate-900 hover:opacity-95"
                      style={{ background: ACTION_BUTTON_ALT }}
                    >
                      Post Final Resolution
                    </Link>
                  ) : null}

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

                  {(isResolved || (!isAuthor && isAwaitingLike)) && id ? (
                    <Link
                      href={`/q/${id}/results`}
                      className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                      style={{ background: CORAL }}
                    >
                      View Results
                    </Link>
                  ) : null}

                  {(isResolved || isAwaitingLike) ? (
                    <button
                      type="button"
                      onClick={handleShare}
                      className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                      style={{ color: NAVY }}
                      title="Share this Quandr3"
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
                <span
                  className="rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{ background: badge.bg, color: badge.fg }}
                >
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

                {q.city || q.state ? (
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

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={curiosoHref}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                  style={{ color: NAVY }}
                >
                  View Curioso
                </Link>

                <div className="text-sm text-slate-600">
                  Curioso:{" "}
                  <span className="font-extrabold" style={{ color: NAVY }}>
                    {curiosoName}
                  </span>
                </div>
              </div>

              <div id="vote" className="mt-8 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    Voting (A–D)
                  </div>
                  <div className="text-xs text-slate-500">
                    {isAuthor && isOpen
                      ? "Your Quandr3 is live. Voting is in progress."
                      : isOpen
                      ? "Tap an option to vote."
                      : "Votes are closed."}
                  </div>
                </div>

                {!isOpen ? (
                  <div className="mt-2 text-sm font-semibold text-slate-700">
                    Votes are no longer accepted for this Quandr3.
                  </div>
                ) : null}

                {isAuthor && isOpen ? (
                  <div className="mt-3 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-800">
                    You posted this Quandr3. Voting is open, so you can watch responses come in,
                    but you cannot vote on your own post. Return after voting closes to post your
                    resolution.
                  </div>
                ) : null}

                {isAuthor && isAwaitingLike ? (
                  <div
                    className="mt-3 rounded-2xl border p-4 text-sm font-semibold"
                    style={{
                      background: ACTION_BG,
                      borderColor: ACTION_BORDER,
                      color: ACTION_TEXT,
                    }}
                  >
                    Voting has ended on your Quandr3. This is now waiting on you. Review the
                    results and post your final resolution to close the loop.
                  </div>
                ) : null}

                {openButNoOptions ? (
                  <div className="mt-3 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-700">
                    This Quandr3 is marked open, but the options haven’t been added yet.
                    <div className="mt-1 text-xs text-slate-600">(Setup issue — not your fault.)</div>
                  </div>
                ) : null}

                {myVote ? (
                  <div className="mt-2 text-sm font-semibold" style={{ color: TEAL }}>
                    You voted: {myVote}
                  </div>
                ) : null}

                {myVote && isOpen && !isAuthor ? (
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
                      <div className="text-xs text-slate-500">
                        Your “why” helps the author understand the internet’s thinking.
                      </div>
                    </div>
                  </div>
                ) : null}

                {votingMsg ? (
                  <div className="mt-3 text-sm font-semibold" style={{ color: TEAL }}>
                    {votingMsg}
                  </div>
                ) : null}

                {votingErr ? (
                  <div className="mt-3 text-sm font-semibold text-red-600">{votingErr}</div>
                ) : null}

                {isAuthor ? (
                  <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                          Author controls
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Open or close discussion for this Quandr3.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleDiscussion}
                        disabled={discSaving}
                        className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-60"
                        style={{ background: q?.discussion_open ? CORAL : BLUE }}
                      >
                        {discSaving
                          ? "Saving…"
                          : q?.discussion_open
                          ? "Close Discussion"
                          : "Open Discussion"}
                      </button>
                    </div>

                    {discErr ? (
                      <div className="mt-2 text-sm font-semibold text-red-600">{discErr}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                    OPTIONS (A–D)
                  </div>
                  <div className="text-xs text-slate-500">
                    {totalVotes ? (
                      <>
                        <span className="font-semibold">{totalVotes}</span> total vote
                        {totalVotes === 1 ? "" : "s"}
                      </>
                    ) : (
                      <>No votes yet.</>
                    )}
                  </div>
                </div>

                {openButNoOptions ? (
                  <div className="mt-3 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-700">
                    This Quandr3 is open, but the options haven’t been added yet.
                    <div className="mt-1 text-xs text-slate-600">(Setup issue — not your fault.)</div>
                  </div>
                ) : opts.length === 0 ? (
                  <div className="mt-3 text-slate-600">
                    No options found on this Quandr3.
                    <div className="mt-2 text-xs text-slate-500">
                      (This page reads from <span className="font-mono">quandr3_options.text</span>{" "}
                      first, then falls back to <span className="font-mono">quandr3_options.value</span>.)
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    {opts.map((o: any, idx: number) => {
                      const label = cleanLabel(o.label);
                      const value = optText(o);
                      const orderNum = typeof o.order === "number" ? o.order : idx + 1;
                      const votes = Number(voteCounts[label] || 0);

                      const disabled =
                        casting || !!myVote || !isOpen || openButNoOptions || isAuthor;

                      const isLeader = !!leadingLabel && label === leadingLabel;
                      const isWinner = !!closedWinnerLabel && label === closedWinnerLabel;
                      const emphasize = isLeader || isWinner;

                      return (
                        <button
                          key={o.id || idx}
                          type="button"
                          disabled={disabled}
                          onClick={() => castVote(label)}
                          className="w-full rounded-2xl border p-4 text-left hover:bg-slate-50 disabled:opacity-60"
                          style={{
                            borderColor: emphasize ? CORAL : undefined,
                            boxShadow: emphasize
                              ? "0 0 0 2px rgba(255,107,107,0.18) inset"
                              : undefined,
                            background: emphasize ? "#fff7f7" : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-extrabold tracking-[0.18em] text-slate-500">
                                {label}
                              </div>

                              {isLeader ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                                  style={{ background: "#ffe4e6", color: "#be123c" }}
                                >
                                  LEADING
                                </span>
                              ) : null}

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
                          <VoteBar label={label} emphasize={emphasize} />

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

              <div id="results" className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                    WHY PEOPLE CHOSE…
                  </div>

                  {closedWinnerLabel ? (
                    <div className="text-xs font-bold" style={{ color: CORAL }}>
                      Winner: {closedWinnerLabel}
                    </div>
                  ) : leadingLabel ? (
                    <div className="text-xs font-bold" style={{ color: CORAL }}>
                      Leading: {leadingLabel}
                    </div>
                  ) : isTie ? (
                    <div className="text-xs font-bold text-slate-500">
                      {isOpen ? "Currently tied" : "Tie"}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ALLOWED.map((L) => {
                    const list = reasonsByLabel[L] || [];
                    const isLeader = !!leadingLabel && L === leadingLabel;
                    const isWinner = !!closedWinnerLabel && L === closedWinnerLabel;
                    const emphasize = isLeader || isWinner;

                    return (
                      <div
                        key={L}
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: emphasize ? CORAL : undefined,
                          background: emphasize ? "#fff7f7" : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                              Why people chose {L}
                            </div>

                            {isLeader ? (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                                style={{ background: "#ffe4e6", color: "#be123c" }}
                              >
                                LEADING
                              </span>
                            ) : null}

                            {isWinner ? (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                                style={{ background: "#ffe4e6", color: "#be123c" }}
                              >
                                WINNER
                              </span>
                            ) : null}
                          </div>

                          <div className="text-xs font-bold text-slate-500">
                            {totalVotes ? `${pct(L)}%` : "—"}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div
                            className="h-2 w-full rounded-full border bg-white"
                            style={{ borderColor: emphasize ? CORAL : "#e2e8f0" }}
                          >
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: totalVotes ? `${pct(L)}%` : "0%",
                                background: emphasize ? CORAL : NAVY,
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
                  If votes exist but you can’t see them here, it’s almost always an RLS/select policy
                  on <span className="font-mono">quandr3_choices</span>.
                </div>
              </div>

              {isResolved ? (
                <div
                  id="final"
                  className="mt-10 rounded-2xl border p-5"
                  style={{ borderColor: CORAL, background: "#fff7f7" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                      Final resolution
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-extrabold"
                        style={{ background: CORAL, color: "white" }}
                      >
                        CURIOUSO VERDICT
                      </span>

                      {id ? (
                        <Link
                          href={`/q/${id}/results`}
                          className="rounded-full px-3 py-1 text-[11px] font-extrabold text-white hover:opacity-95"
                          style={{ background: NAVY }}
                        >
                          Open Results Page
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {q?.resolved_choice_label ? (
                      <>
                        Final choice:{" "}
                        <span className="font-extrabold" style={{ color: CORAL }}>
                          {q.resolved_choice_label}
                        </span>
                      </>
                    ) : (
                      "A final choice has been posted."
                    )}
                  </div>

                  {q?.resolution_note ? (
                    <div className="mt-2 text-sm text-slate-700">{q.resolution_note}</div>
                  ) : null}

                  {q?.resolved_at ? (
                    <div className="mt-2 text-xs text-slate-500">Resolved: {fmt(q.resolved_at)}</div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </section>

        <div className="mt-6 text-center text-xs text-slate-500">
          Quandr3: <span className="font-semibold">Ask.</span>{" "}
          <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </main>
  );
}