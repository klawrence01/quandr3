// app/q/[id]/page.tsx
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

/** ✅ Category hero mapping (set-and-forget)
 *  Place images in: /public/quandr3/placeholders/
 *  money.jpg, career.jpg, relationships.jpg, health.jpg, family.jpg, tech.jpg, default.jpg
 */
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

function hoursLeft(createdAt: string, duration: number) {
  const dur = Number(duration || 0);
  if (!createdAt || !dur) return 0;
  const end = new Date(createdAt).getTime() + dur * 3600 * 1000;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
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

function pillStyle(kind: "open" | "awaiting_user" | "resolved") {
  if (kind === "open") return { bg: "rgba(30,99,243,0.12)", fg: BLUE, label: "Open" };
  if (kind === "awaiting_user")
    return { bg: "rgba(255,107,107,0.12)", fg: CORAL, label: "Closed (Awaiting Curioso)" };
  return { bg: "rgba(0,169,165,0.12)", fg: TEAL, label: "Resolved" };
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
  return opt?.image_url || opt?.media_url || opt?.photo_url || opt?.img_url || categoryFallback(qCategory);
}

/** ✅ Creator helpers (Phase-1 safe) */
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

/* =========================
   Page
========================= */

export default function Quandr3DetailPage() {
  const params = useParams();
  const router = useRouter();

  // Normalize id (Next can give string|string[])
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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Vote reasons
  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>({});
  const [reasonDraftByVoteId, setReasonDraftByVoteId] = useState<Record<string, string>>({});
  const [savingReason, setSavingReason] = useState(false);

  // Discussion
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentProfilesById, setCommentProfilesById] = useState<Record<string, any>>({});

  // Curioso toggles
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  /* =========================
     Load Auth
  ========================= */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  /* =========================
     Load / Refresh Helpers
  ========================= */

  async function refreshVotesAndReasons(qid: string) {
    const { data: v } = await supabase.from("quandr3_votes").select("*").eq("quandr3_id", qid);
    const vRows = v ?? [];
    setVotes(vRows);

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

    return vRows;
  }

  async function refreshComments(qid: string) {
    const { data: rows } = await supabase
      .from("quandr3_comments")
      .select("*")
      .eq("quandr3_id", qid)
      .order("created_at", { ascending: true });

    const c = rows ?? [];
    setComments(c);

    const userIds = Array.from(new Set(c.map((x: any) => x.user_id).filter(Boolean)));
    if (!userIds.length) {
      setCommentProfilesById({});
      return;
    }

    const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);

    const map: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => (map[p.id] = p));
    setCommentProfilesById(map);
  }

  async function refreshCore(qid: string) {
    const { data: qRow } = await supabase.from("quandr3s").select("*").eq("id", qid).single();
    setQ(qRow ?? null);

    // creator profile fetch (supports author_id OR user_id OR creator_id OR created_by)
    const creatorId = getCreatorId(qRow);
    if (creatorId) {
      const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", creatorId).single();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }

    const { data: opts } = await supabase.from("quandr3_options").select("*").eq("quandr3_id", qid).order("order", { ascending: true });
    setOptions(opts ?? []);

    const vRows = await refreshVotesAndReasons(qid);

    const { data: r } = await supabase.from("quandr3_resolutions").select("*").eq("quandr3_id", qid).maybeSingle();
    setResolution(r ?? null);

    // Discussion fetch only if opened, voting ended, and viewer voted
    const duration = Number(qRow?.voting_duration_hours || 0);
    const createdAt = qRow?.created_at;
    const timeExpired =
      !!createdAt && !!duration ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000 : false;

    const voteCapReached = qRow?.voting_max_votes ? vRows.length >= Number(qRow.voting_max_votes) : false;
    const votingEnded = timeExpired || voteCapReached || !!r;

    const didVote = !!user?.id && vRows.some((x: any) => x.user_id === user.id);

    if (qRow?.discussion_open && votingEnded && didVote) {
      await refreshComments(qid);
    } else {
      setComments([]);
      setCommentDraft("");
      setCommentProfilesById({});
    }
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      await refreshCore(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  /* =========================
     Derived Logic
  ========================= */

  const myVote = useMemo(() => (user ? votes.find((v: any) => v.user_id === user.id) ?? null : null), [votes, user]);
  const didVote = useMemo(() => !!myVote?.id, [myVote]);

  const myReason = useMemo(() => (myVote?.id ? cleanReason(reasonsByVoteId[myVote.id] ?? "") : ""), [myVote, reasonsByVoteId]);

  const voteCounts = useMemo(() => {
    const map: Record<number, number> = {};
    votes.forEach((v: any) => (map[v.choice_index] = (map[v.choice_index] || 0) + 1));
    return map;
  }, [votes]);

  const totalVotes = votes.length;

  const votingExpired = useMemo(() => {
    if (!q) return false;
    const duration = Number(q.voting_duration_hours || 0);
    const createdAt = q.created_at;
    const timeExpired =
      !!createdAt && !!duration ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000 : false;
    const voteCapReached = q.voting_max_votes ? totalVotes >= Number(q.voting_max_votes) : false;
    return timeExpired || voteCapReached;
  }, [q, totalVotes]);

  const status = useMemo(() => {
    if (resolution) return "resolved";
    if (votingExpired) return "awaiting_user";
    return "open";
  }, [resolution, votingExpired]);

  const canShowResults = useMemo(() => status !== "open", [status]);

  const winningOrder = useMemo(() => {
    if (resolution) {
      const opt = options.find((o: any) => o.id === resolution.option_id);
      return opt?.order;
    }
    let max = 0;
    let win: any = null;
    Object.entries(voteCounts).forEach(([k, v]: any) => {
      if (v > max) {
        max = v;
        win = Number(k);
      }
    });
    return win;
  }, [voteCounts, resolution, options]);

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

  const canEditReason = useMemo(() => !!user && status === "open" && !votingExpired && !resolution, [user, status, votingExpired, resolution]);

  const isCurioso = useMemo(() => {
    if (!user?.id) return false;
    const cid = getCreatorId(q);
    if (!cid) return false;
    return user.id === cid;
  }, [user, q]);

  const canToggleDiscussion = useMemo(() => (isCurioso ? votingExpired || !!resolution : false), [isCurioso, votingExpired, resolution]);

  const statusPill = useMemo(() => pillStyle(status as any), [status]);

  const heroImg = useMemo(() => (q?.media_url ? q.media_url : heroForCategory(q?.category)), [q]);

  const discussionBadge = useMemo(() => {
    if (status === "open") return { label: "Discussion: Locked", bg: "rgba(148,163,184,0.18)", fg: "rgb(100 116 139)" };
    if (!!q?.discussion_open) return { label: "Discussion: Open", bg: "rgba(0,169,165,0.12)", fg: TEAL };
    return { label: "Discussion: Closed", bg: "rgba(148,163,184,0.18)", fg: "rgb(100 116 139)" };
  }, [status, q]);

  const creatorName = useMemo(() => creatorLabel(q, profile), [q, profile]);

  /* =========================
     Actions
  ========================= */

  async function vote(order: number) {
    if (!id) return;
    if (!user) return router.push(`/login?next=/q/${id}`);
    if (votingExpired || resolution) return;

    const { data: inserted, error } = await supabase
      .from("quandr3_votes")
      .insert({ quandr3_id: id, user_id: user.id, choice_index: order })
      .select("id, user_id, choice_index, quandr3_id, created_at")
      .single();

    if (error) return refreshVotesAndReasons(id);

    try {
      localStorage.setItem(`quandr3-voted-${id}`, "1");
    } catch {}

    await refreshVotesAndReasons(id);

    if (inserted?.id) {
      setReasonDraftByVoteId((prev: any) => ({ ...prev, [inserted.id]: cleanReason(prev[inserted.id]) ?? "" }));
    }
  }

  async function saveMyReason() {
    if (!id) return;
    if (!user) return router.push(`/login?next=/q/${id}`);
    if (!myVote?.id || !canEditReason) return;

    const draft = cleanReason(reasonDraftByVoteId[myVote.id] ?? "");
    if (!draft) return;

    setSavingReason(true);
    const { error } = await supabase.from("vote_reasons").upsert({ vote_id: myVote.id, reason: draft }, { onConflict: "vote_id" });
    setSavingReason(false);

    if (error) return alert(error.message || "Could not save reason.");
    await refreshVotesAndReasons(id);
  }

  async function postComment() {
    if (!id) return;
    if (!user) return router.push(`/login?next=/q/${id}`);

    const body = commentDraft.trim();
    if (!body) return;

    setPostingComment(true);
    const { error } = await supabase.from("quandr3_comments").insert({ quandr3_id: id, user_id: user.id, body });
    setPostingComment(false);

    if (error) return alert(error.message || "Could not post comment.");
    setCommentDraft("");
    await refreshComments(id);
  }

  async function deleteComment(commentId: string) {
    if (!id) return;
    if (!user) return router.push(`/login?next=/q/${id}`);

    const { error } = await supabase.from("quandr3_comments").delete().eq("id", commentId);
    if (error) return alert(error.message || "Could not delete comment.");
    await refreshComments(id);
  }

  async function setDiscussionOpen(nextOpen: boolean) {
    if (!id) return;
    if (!user) return router.push(`/login?next=/q/${id}`);
    if (!isCurioso || !canToggleDiscussion) return;

    setTogglingDiscussion(true);
    const { error } = await supabase.from("quandr3s").update({ discussion_open: nextOpen }).eq("id", id);
    setTogglingDiscussion(false);

    if (error) {
      return alert(error.message || "Could not toggle discussion (likely RLS). Make sure only the author can update discussion_open.");
    }
    await refreshCore(id);
  }

  /* =========================
     Render
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Quandr3…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling the question, options, and current votes.</div>
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
              <Link href="/explore" className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: BLUE }}>
                Back to Explore
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const createdAt = q.created_at;
  const duration = Number(q.voting_duration_hours || 0);
  const left = status === "open" ? hoursLeft(createdAt, duration) : 0;

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/explore" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
              <span className="text-lg" style={{ color: NAVY }}>
                ?
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Quandr3
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">ASK. SHARE. DECIDE.</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/q/create" className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE }}>
              Create a Quandr3
            </Link>

            {user ? (
              <Link href="/account" className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
                Account
              </Link>
            ) : (
              <>
                <Link href={`/login?next=/q/${id}`} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
                  Log in
                </Link>
                <Link href="/signup" className="rounded-full px-4 py-2 text-sm font-extrabold text-white" style={{ background: NAVY }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HERO BANNER */}
        <section className="overflow-hidden rounded-[28px] border bg-white shadow-sm">
          <div className="relative h-[240px] w-full">
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

            <div className="absolute right-5 top-5 flex items-center gap-2">
              <button
                className="rounded-full border bg-white/90 px-4 py-2 text-xs font-extrabold"
                style={{ borderColor: "rgba(255,255,255,0.55)", color: NAVY }}
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied!");
                  } catch {
                    alert("Could not copy link.");
                  }
                }}
              >
                Share
              </button>
              <button
                className="rounded-full border bg-white/90 px-4 py-2 text-xs font-extrabold"
                style={{ borderColor: "rgba(255,255,255,0.55)", color: CORAL }}
                onClick={() => alert("Report flow coming next.")}
              >
                Report
              </button>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex flex-wrap items-center gap-3 text-white/90">
                <span className="text-xs font-semibold">
                  {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                  {status === "open" ? (
                    <>
                      {" "}
                      • <span className="font-extrabold text-white">{left}h</span> left
                    </>
                  ) : null}
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

          {/* META STRIP */}
          <div className="grid gap-4 p-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">HOW IT WORKS</div>
              <div className="mt-2 text-sm text-slate-700">
                Vote while it’s open. After it closes, results unlock so everyone learns. Discussion (if opened) is <b>after close</b> and <b>voters only</b>.
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-600">CURIOSO</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border bg-slate-50">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-slate-500">?</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    {creatorName}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Category:{" "}
                    <span className="font-semibold" style={{ color: NAVY }}>
                      {q.category ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">VOTES</div>
                  <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                    {totalVotes}
                  </div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">STATUS</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    {status}
                  </div>
                </div>
              </div>

              {canShowResults ? (
                <div className="mt-4">
                  <Link href={`/q/${id}/results`} className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE }}>
                    View Results
                  </Link>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-xs text-slate-600">Results unlock after voting closes.</div>
              )}

              {isCurioso ? (
                <div className="mt-4 rounded-2xl border bg-white p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-600">CURIOSO CONTROLS</div>
                  <div className="mt-2 text-xs text-slate-600">
                    You can open discussion <b>after voting ends</b>.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl px-3 py-2 text-xs font-extrabold text-white"
                      style={{ background: TEAL, opacity: canToggleDiscussion ? 1 : 0.45 }}
                      disabled={!canToggleDiscussion || togglingDiscussion}
                      onClick={() => setDiscussionOpen(true)}
                      title={!canToggleDiscussion ? "Available after voting ends." : ""}
                    >
                      {togglingDiscussion ? "Working…" : "Open Discussion"}
                    </button>

                    <button
                      className="rounded-xl px-3 py-2 text-xs font-extrabold text-white"
                      style={{ background: CORAL, opacity: canToggleDiscussion ? 1 : 0.45 }}
                      disabled={!canToggleDiscussion || togglingDiscussion}
                      onClick={() => setDiscussionOpen(false)}
                      title={!canToggleDiscussion ? "Available after voting ends." : ""}
                    >
                      {togglingDiscussion ? "Working…" : "Close Discussion"}
                    </button>

                    {status === "awaiting_user" || status === "resolved" ? (
                      <Link href={`/q/${id}/resolve`} className="rounded-xl px-3 py-2 text-xs font-extrabold text-white" style={{ background: NAVY }} title="Curioso decision panel">
                        Go to Resolve
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    Discussion flag is <b style={{ color: NAVY }}>{q?.discussion_open ? "ON" : "OFF"}</b> (but it’s still locked until close).
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* OPTIONS */}
        <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">OPTIONS</div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                {status === "open" ? "Pick your answer" : "See how it played out"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {status === "open" ? "Vote while it’s open. Then add a short reason (optional)." : "Votes and reasons appear after close so everyone learns."}
              </div>
            </div>

            {status === "open" ? (
              <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-xs text-slate-600">Tip: After you vote, add a reason. It makes the outcome more valuable.</div>
            ) : null}
          </div>

          {!options?.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">No options found for this Quandr3 yet.</div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {options.map((opt: any, i: number) => {
                const count = voteCounts[opt.order] || 0;
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

                const isWinner = opt.order === winningOrder;
                const optReasons = reasonsByChoiceIndex[opt.order] ?? [];
                const isMyPicked = myVote?.choice_index === opt.order;

                const showReasonBox = !!myVote?.id && isMyPicked && canEditReason;
                const voteIdForMyVote = myVote?.id;

                const reasonDraft = voteIdForMyVote != null ? reasonDraftByVoteId[voteIdForMyVote] ?? myReason ?? "" : "";
                const img = getOptImage(opt, q?.category);

                return (
                  <div
                    key={opt.id}
                    className="overflow-hidden rounded-[26px] border bg-white shadow-sm"
                    style={{ borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(15,23,42,0.12)" }}
                  >
                    {/* ✅ NEW: SMALL THUMB (left) + CONTENT (right) */}
                    <div className="grid md:grid-cols-[160px_1fr]">
                      {/* Left thumbnail (small / ~25%) */}
                      <div className="relative h-[140px] w-full md:h-full md:min-h-[140px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2343aa] to-transparent" />

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-extrabold text-white" style={{ background: isWinner ? TEAL : NAVY }}>
                            {LETTER[opt.order - 1] ?? String.fromCharCode(65 + i)}
                          </span>
                          {isWinner && status !== "open" ? (
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold" style={{ color: TEAL }}>
                              Winning path
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                              {safeStr(opt.label) || `Option ${LETTER[opt.order - 1] ?? "?"}`}
                            </div>

                            {status !== "open" ? (
                              <div className="mt-1 text-xs text-slate-600">
                                {count} vote{count === 1 ? "" : "s"} • {pct}%
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-slate-600">Choose and (optionally) add your reason.</div>
                            )}
                          </div>

                          {status !== "open" ? (
                            <span className="shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold" style={{ background: statusPill.bg, color: statusPill.fg }}>
                              {statusPill.label}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          {status === "open" ? (
                            <button onClick={() => vote(opt.order)} className="w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE }}>
                              Vote
                            </button>
                          ) : (
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isWinner ? TEAL : BLUE }} />
                            </div>
                          )}
                        </div>

                        {optReasons.length > 0 && canShowResults ? (
                          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-600">WHY PEOPLE CHOSE THIS</div>
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-800">
                              {optReasons.slice(0, 5).map((txt: string, idx: number) => (
                                <li key={`${opt.id}-r-${idx}`} className="leading-snug">
                                  {txt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {showReasonBox ? (
                          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-600">{myReason ? "EDIT YOUR REASON" : "WHY DID YOU CHOOSE THIS?"}</div>

                            <textarea
                              value={reasonDraft}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReasonDraftByVoteId((prev: any) => ({ ...prev, [voteIdForMyVote]: val }));
                              }}
                              rows={3}
                              className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2"
                              style={{ borderColor: "rgba(15,23,42,0.12)" }}
                              placeholder="Write a short reason (1–2 sentences is perfect)."
                            />

                            <div className="mt-2">
                              <button onClick={saveMyReason} disabled={savingReason} className="rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm" style={{ background: NAVY, opacity: savingReason ? 0.7 : 1 }}>
                                {savingReason ? "Saving…" : "Save reason"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RESOLUTION */}
        {resolution ? (
          <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">RESOLUTION</div>
            <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
              The Curioso decided
            </div>

            <div className="mt-4 rounded-2xl border bg-slate-50 p-5">
              <div className="whitespace-pre-wrap text-sm text-slate-800">{resolution.note ? resolution.note : "No note was left for this resolution."}</div>
              <div className="mt-3 text-xs text-slate-600">
                Resolved on <span className="font-semibold">{fmt(resolution.created_at)}</span>
              </div>
            </div>
          </section>
        ) : null}

        {/* DISCUSSION */}
        <section className="mt-7 rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">DISCUSSION</div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                Deliberate after the close (voters only)
              </div>
              <div className="mt-1 text-sm text-slate-600">Discussion is optional. If opened, only voters can post. Everyone else can learn from the results.</div>
            </div>

            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: discussionBadge.bg, color: discussionBadge.fg }}>
              {discussionBadge.label}
            </div>
          </div>

          {status === "open" ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">Discussion is locked while voting is open.</div>
          ) : !q.discussion_open ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">Discussion is closed.</div>
          ) : !user ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">Log in to see if you’re invited to the discussion.</div>
          ) : !didVote ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">Discussion is for voters only on this Quandr3.</div>
          ) : (
            <>
              <div className="mt-5 rounded-3xl border bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-widest text-slate-600">ADD YOUR TAKE</div>

                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border bg-white p-3 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  placeholder="Share your take (keep it respectful)."
                  disabled={postingComment}
                />

                <div className="mt-2">
                  <button onClick={postComment} disabled={postingComment} className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm" style={{ background: BLUE, opacity: postingComment ? 0.7 : 1 }}>
                    {postingComment ? "Posting…" : "Post comment"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600">No comments yet.</div>
                ) : (
                  comments.map((c: any) => {
                    const p = commentProfilesById[c.user_id];
                    const canDelete = user?.id && c.user_id === user.id;

                    return (
                      <div key={c.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-2xl border bg-slate-50">
                              {p?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-500">?</div>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                                {p?.display_name ?? "Member"}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">{fmt(c.created_at)}</div>
                            </div>
                          </div>

                          {canDelete ? (
                            <button onClick={() => deleteComment(c.id)} className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
                              Delete
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{c.body}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">Quandr3 • Ask • Share • Decide</div>
      </div>
    </main>
  );
}
