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

function cleanReason(s?: string) {
  if (!s) return "";
  const t = String(s).trim();
  if (!t) return "";
  if (t.toUpperCase() === "UPDATED TEXT HERE") return "";
  return t;
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function pillStyle(kind: "open" | "awaiting_user" | "resolved") {
  if (kind === "open") {
    return { bg: "rgba(30,99,243,0.12)", fg: BLUE, label: "Open" };
  }
  if (kind === "awaiting_user") {
    return { bg: "rgba(255,107,107,0.12)", fg: CORAL, label: "Closed (Awaiting Curioso)" };
  }
  return { bg: "rgba(0,169,165,0.12)", fg: TEAL, label: "Resolved" };
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
  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>(
    {}
  );
  const [reasonDraftByVoteId, setReasonDraftByVoteId] = useState<
    Record<string, string>
  >({});
  const [savingReason, setSavingReason] = useState(false);

  // Discussion
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentProfilesById, setCommentProfilesById] = useState<Record<string, any>>(
    {}
  );

  // Curioso toggles
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  /* =========================
     Load Auth
  ========================= */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  /* =========================
     Load / Refresh Helpers
  ========================= */

  async function refreshVotesAndReasons(qid: string) {
    const { data: v } = await supabase
      .from("quandr3_votes")
      .select("*")
      .eq("quandr3_id", qid);

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

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const map: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => {
      map[p.id] = p;
    });
    setCommentProfilesById(map);
  }

  async function refreshCore(qid: string) {
    const { data: qRow } = await supabase
      .from("quandr3s")
      .select("*")
      .eq("id", qid)
      .single();

    setQ(qRow ?? null);

    if (qRow?.author_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", qRow.author_id)
        .single();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }

    const { data: opts } = await supabase
      .from("quandr3_options")
      .select("*")
      .eq("quandr3_id", qid)
      .order("order", { ascending: true });

    setOptions(opts ?? []);

    const vRows = await refreshVotesAndReasons(qid);

    const { data: r } = await supabase
      .from("quandr3_resolutions")
      .select("*")
      .eq("quandr3_id", qid)
      .maybeSingle();

    setResolution(r ?? null);

    // ✅ Discussion fetch ONLY if:
    // - discussion is open
    // - voting is NOT open anymore (expired OR resolved)
    // - and this viewer has voted (invited)
    const duration = Number(qRow?.voting_duration_hours || 0);
    const createdAt = qRow?.created_at;
    const timeExpired =
      !!createdAt && !!duration
        ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000
        : false;

    const voteCapReached =
      qRow?.voting_max_votes ? vRows.length >= Number(qRow.voting_max_votes) : false;

    const votingEnded = timeExpired || voteCapReached || !!r;

    const didVote =
      !!user?.id && vRows.some((x: any) => x.user_id === user.id);

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
  }, [id, user?.id]); // re-evaluate invite gating after login loads

  /* =========================
     Derived Logic
  ========================= */

  const myVote = useMemo(() => {
    if (!user) return null;
    return votes.find((v: any) => v.user_id === user.id) ?? null;
  }, [votes, user]);

  const didVote = useMemo(() => !!myVote?.id, [myVote]);

  const myReason = useMemo(() => {
    if (!myVote?.id) return "";
    return cleanReason(reasonsByVoteId[myVote.id] ?? "");
  }, [myVote, reasonsByVoteId]);

  const voteCounts = useMemo(() => {
    const map: Record<number, number> = {};
    votes.forEach((v: any) => {
      map[v.choice_index] = (map[v.choice_index] || 0) + 1;
    });
    return map;
  }, [votes]);

  const totalVotes = votes.length;

  const votingExpired = useMemo(() => {
    if (!q) return false;

    const duration = Number(q.voting_duration_hours || 0);
    const createdAt = q.created_at;

    const timeExpired =
      !!createdAt && !!duration
        ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000
        : false;

    const voteCapReached =
      q.voting_max_votes ? totalVotes >= Number(q.voting_max_votes) : false;

    return timeExpired || voteCapReached;
  }, [q, totalVotes]);

  const status = useMemo(() => {
    if (resolution) return "resolved";
    if (votingExpired) return "awaiting_user";
    return "open";
  }, [resolution, votingExpired]);

  const canShowResults = useMemo(() => status !== "open", [status]);

  const canShowDiscussion = useMemo(() => {
    // discussion only after close AND only for those who voted AND only if author opened it
    return status !== "open" && !!q?.discussion_open && didVote;
  }, [status, q, didVote]);

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
      const rid = v.id;
      const txt = cleanReason(reasonsByVoteId[rid]);
      if (!txt) return;
      const idx = v.choice_index;
      grouped[idx] = grouped[idx] || [];
      grouped[idx].push(txt);
    });
    return grouped;
  }, [votes, reasonsByVoteId]);

  // Only allow editing reasons while voting is open
  const canEditReason = useMemo(() => {
    return !!user && status === "open" && !votingExpired && !resolution;
  }, [user, status, votingExpired, resolution]);

  const isCurioso = useMemo(() => {
    if (!user?.id || !q?.author_id) return false;
    return user.id === q.author_id;
  }, [user, q]);

  const canToggleDiscussion = useMemo(() => {
    // Curioso can open/close discussion after voting ends OR after resolution.
    if (!isCurioso) return false;
    return votingExpired || !!resolution;
  }, [isCurioso, votingExpired, resolution]);

  const statusPill = useMemo(() => pillStyle(status as any), [status]);

  /* =========================
     Actions
  ========================= */

  async function vote(order: number) {
    if (!id) return;

    if (!user) {
      router.push(`/login?next=/q/${id}`);
      return;
    }
    if (votingExpired || resolution) return;

    const { data: inserted, error } = await supabase
      .from("quandr3_votes")
      .insert({
        quandr3_id: id,
        user_id: user.id,
        choice_index: order,
      })
      .select("id, user_id, choice_index, quandr3_id, created_at")
      .single();

    if (error) {
      await refreshVotesAndReasons(id);
      return;
    }

    try {
      localStorage.setItem(`quandr3-voted-${id}`, "1");
    } catch {}

    await refreshVotesAndReasons(id);

    if (inserted?.id) {
      setReasonDraftByVoteId((prev: any) => ({
        ...prev,
        [inserted.id]: cleanReason(prev[inserted.id]) ?? "",
      }));
    }
  }

  async function saveMyReason() {
    if (!id) return;

    if (!user) {
      router.push(`/login?next=/q/${id}`);
      return;
    }
    if (!myVote?.id) return;
    if (!canEditReason) return;

    const draft = cleanReason(reasonDraftByVoteId[myVote.id] ?? "");
    if (!draft) return;

    setSavingReason(true);

    const { error } = await supabase
      .from("vote_reasons")
      .upsert(
        {
          vote_id: myVote.id,
          reason: draft,
        },
        { onConflict: "vote_id" }
      );

    setSavingReason(false);

    if (error) {
      alert(error.message || "Could not save reason.");
      return;
    }

    await refreshVotesAndReasons(id);
  }

  async function postComment() {
    if (!id) return;

    if (!user) {
      router.push(`/login?next=/q/${id}`);
      return;
    }

    if (!canShowDiscussion) return;

    const body = commentDraft.trim();
    if (!body) return;

    setPostingComment(true);

    const { error } = await supabase.from("quandr3_comments").insert({
      quandr3_id: id,
      user_id: user.id,
      body,
    });

    setPostingComment(false);

    if (error) {
      alert(error.message || "Could not post comment.");
      return;
    }

    setCommentDraft("");
    await refreshComments(id);
  }

  async function deleteComment(commentId: string) {
    if (!id) return;

    if (!user) {
      router.push(`/login?next=/q/${id}`);
      return;
    }

    const { error } = await supabase.from("quandr3_comments").delete().eq("id", commentId);

    if (error) {
      alert(error.message || "Could not delete comment.");
      return;
    }

    await refreshComments(id);
  }

  async function setDiscussionOpen(nextOpen: boolean) {
    if (!id) return;

    if (!user) {
      router.push(`/login?next=/q/${id}`);
      return;
    }
    if (!isCurioso) return;
    if (!canToggleDiscussion) return;

    setTogglingDiscussion(true);

    const { error } = await supabase
      .from("quandr3s")
      .update({ discussion_open: nextOpen })
      .eq("id", id);

    setTogglingDiscussion(false);

    if (error) {
      alert(
        error.message ||
          "Could not toggle discussion (likely RLS). Make sure only the author can update discussion_open."
      );
      return;
    }

    await refreshCore(id);
  }

  /* =========================
     Render
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Quandr3…
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Pulling the question, options, and current votes.
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!q) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Not found
            </div>
            <div className="mt-2 text-sm text-slate-600">
              That Quandr3 ID doesn’t exist (or RLS is blocking it).
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

  const createdAt = q.created_at;
  const duration = Number(q.voting_duration_hours || 0);
  const left = status === "open" ? hoursLeft(createdAt, duration) : 0;

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top header (simple, clean) */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/explore" className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
              title="Quandr3"
            >
              <span className="text-lg" style={{ color: NAVY }}>
                ?
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Quandr3
              </div>
              <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">
                ASK. SHARE. DECIDE.
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

            {user ? (
              <Link
                href="/account"
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              >
                Account
              </Link>
            ) : (
              <>
                <Link
                  href={`/login?next=/q/${id}`}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  style={{ borderColor: "rgba(15,23,42,0.12)" }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white"
                  style={{ background: NAVY }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HERO */}
        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
          <section className="rounded-3xl border bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold"
                style={{ background: statusPill.bg, color: statusPill.fg }}
              >
                {statusPill.label}
              </span>

              <span className="text-xs text-slate-600">
                {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                {status === "open" ? (
                  <>
                    {" "}
                    •{" "}
                    <span className="font-semibold" style={{ color: NAVY }}>
                      {left}h
                    </span>{" "}
                    left
                  </>
                ) : null}
              </span>

              <span className="text-xs text-slate-400">•</span>

              <span className="text-xs text-slate-600">
                Created{" "}
                <span className="font-semibold" style={{ color: NAVY }}>
                  {fmt(q.created_at)}
                </span>
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight" style={{ color: NAVY }}>
              {q.title || "Untitled Quandr3"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              One person decides. Everyone learns. Vote while it’s open, then see the outcome and
              the reasons behind it.
            </p>

            {/* Reasoning */}
            {q.reasoning ? (
              <div className="mt-6 rounded-2xl border bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-widest text-slate-600">
                  WHY I ASKED THIS
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {q.reasoning}
                </div>
              </div>
            ) : null}
          </section>

          {/* Curioso Card */}
          <aside className="rounded-3xl border bg-white p-7 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              CURIOSO
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-slate-500">
                    ?
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                  {profile?.display_name ?? "Unknown"}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Category:{" "}
                  <span className="font-semibold" style={{ color: NAVY }}>
                    {q.category ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  VOTES
                </div>
                <div className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
                  {totalVotes}
                </div>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  STATUS
                </div>
                <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                  {status}
                </div>
              </div>
            </div>

            {/* Curioso-only controls */}
            {isCurioso ? (
              <div className="mt-5 rounded-2xl border bg-white p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-600">
                  CURIOSO CONTROLS
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  You can open discussion <span className="font-semibold">after voting closes</span>.
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

                  {/* Resolve link appears once closed OR resolved (Curioso flow) */}
                  {(status === "awaiting_user" || status === "resolved") ? (
                    <Link
                      href={`/q/${id}/resolve`}
                      className="rounded-xl px-3 py-2 text-xs font-extrabold text-white"
                      style={{ background: NAVY }}
                      title="Curioso decision panel"
                    >
                      Go to Resolve
                    </Link>
                  ) : null}
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  Discussion is currently{" "}
                  <span className="font-extrabold" style={{ color: NAVY }}>
                    {q.discussion_open ? "OPEN" : "CLOSED"}
                  </span>
                  .
                </div>
              </div>
            ) : null}

            {/* Results shortcut after close for everyone */}
            {canShowResults ? (
              <div className="mt-5">
                <Link
                  href={`/q/${id}/results`}
                  className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm"
                  style={{ background: BLUE }}
                >
                  View Results
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border bg-slate-50 p-4 text-xs text-slate-600">
                Results unlock after voting closes.
              </div>
            )}
          </aside>
        </div>

        {/* OPTIONS */}
        <section className="mt-7 rounded-3xl border bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">
                OPTIONS
              </div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                {status === "open" ? "Pick your answer" : "See how it played out"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {status === "open"
                  ? "Vote while it’s open. Then add a short reason (optional)."
                  : "Votes and reasons appear after close so everyone learns."}
              </div>
            </div>

            {status === "open" ? (
              <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Tip: After you vote, add a reason. It makes the outcome more valuable.
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(options?.length ? options : []).map((opt: any, i: number) => {
              const count = voteCounts[opt.order] || 0;
              const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

              const isWinner = opt.order === winningOrder;
              const optReasons = reasonsByChoiceIndex[opt.order] ?? [];
              const isMyPicked = myVote?.choice_index === opt.order;

              const showReasonBox = !!myVote?.id && isMyPicked && canEditReason;
              const voteIdForMyVote = myVote?.id;

              const reasonDraft =
                voteIdForMyVote != null
                  ? (reasonDraftByVoteId[voteIdForMyVote] ?? myReason ?? "")
                  : "";

              return (
                <div
                  key={opt.id}
                  className="rounded-3xl border p-5 shadow-sm"
                  style={{
                    borderColor: isWinner ? "rgba(0,169,165,0.55)" : "rgba(15,23,42,0.12)",
                    background: isWinner ? "rgba(0,169,165,0.05)" : "white",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
                        style={{ background: isWinner ? TEAL : NAVY }}
                        title="Option"
                      >
                        {LETTER[opt.order - 1] ?? String.fromCharCode(65 + i)}
                      </div>

                      <div className="min-w-0">
                        <div className="text-base font-extrabold leading-snug" style={{ color: NAVY }}>
                          {safeStr(opt.label) || `Option ${LETTER[opt.order - 1] ?? "?"}`}
                        </div>

                        {status !== "open" ? (
                          <div className="mt-1 text-xs text-slate-600">
                            {count} vote{count === 1 ? "" : "s"} • {pct}%
                            {isWinner ? (
                              <span className="ml-2 font-extrabold" style={{ color: TEAL }}>
                                • Winning path
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600">
                            Choose and (optionally) add your reason.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: image / vote button */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-50">
                        {opt.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={opt.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                            image
                          </div>
                        )}
                      </div>

                      {status === "open" ? (
                        <button
                          onClick={() => vote(opt.order)}
                          className="rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm"
                          style={{ background: BLUE }}
                        >
                          Vote
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Progress bar after close */}
                  {status !== "open" ? (
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isWinner ? TEAL : BLUE,
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Reasons list (only after close) */}
                  {optReasons.length > 0 && canShowResults ? (
                    <div className="mt-4 rounded-2xl border bg-white p-4">
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

                  {/* My reason editor (only while open, only for my pick) */}
                  {showReasonBox ? (
                    <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-600">
                        {myReason ? "EDIT YOUR REASON" : "WHY DID YOU CHOOSE THIS?"}
                      </div>

                      <textarea
                        value={reasonDraft}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReasonDraftByVoteId((prev: any) => ({
                            ...prev,
                            [voteIdForMyVote]: val,
                          }));
                        }}
                        rows={3}
                        className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2"
                        style={{ borderColor: "rgba(15,23,42,0.12)" }}
                        placeholder="Write a short reason (1–2 sentences is perfect)."
                      />

                      <div className="mt-2">
                        <button
                          onClick={saveMyReason}
                          disabled={savingReason}
                          className="rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm"
                          style={{ background: NAVY, opacity: savingReason ? 0.7 : 1 }}
                        >
                          {savingReason ? "Saving…" : "Save reason"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* If no options */}
          {!options?.length ? (
            <div className="mt-6 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              No options found for this Quandr3 yet.
            </div>
          ) : null}
        </section>

        {/* Resolution (if exists) */}
        {resolution ? (
          <section className="mt-7 rounded-3xl border bg-white p-7 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              RESOLUTION
            </div>
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

        {/* DISCUSSION */}
        <section className="mt-7 rounded-3xl border bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">
                DISCUSSION
              </div>
              <div className="mt-1 text-xl font-extrabold" style={{ color: NAVY }}>
                Deliberate after the close (voters only)
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Discussion is optional and can be opened by the Curioso after voting ends.
              </div>
            </div>

            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold"
              style={{
                background: q?.discussion_open ? "rgba(0,169,165,0.12)" : "rgba(148,163,184,0.18)",
                color: q?.discussion_open ? TEAL : "rgb(100 116 139)",
              }}
            >
              {q?.discussion_open ? "Discussion: Open" : "Discussion: Closed"}
            </div>
          </div>

          {/* Gate messages */}
          {status === "open" ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
              Discussion opens after voting closes.
            </div>
          ) : !q.discussion_open ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
              Discussion is closed.
            </div>
          ) : !user ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
              Log in to see if you’re invited to the discussion.
            </div>
          ) : !didVote ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
              Discussion is for voters only on this Quandr3.
            </div>
          ) : (
            <>
              {/* Add comment */}
              <div className="mt-5 rounded-3xl border bg-slate-50 p-5">
                <div className="text-xs font-semibold tracking-widest text-slate-600">
                  ADD YOUR TAKE
                </div>

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
                  <button
                    onClick={postComment}
                    disabled={postingComment}
                    className="rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm"
                    style={{ background: BLUE, opacity: postingComment ? 0.7 : 1 }}
                  >
                    {postingComment ? "Posting…" : "Post comment"}
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="mt-5 space-y-3">
                {comments.length === 0 ? (
                  <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600">
                    No comments yet.
                  </div>
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
                                <img
                                  src={p.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-500">
                                  ?
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                                {p?.display_name ?? "Member"}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {fmt(c.created_at)}
                              </div>
                            </div>
                          </div>

                          {canDelete ? (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                              style={{ borderColor: "rgba(15,23,42,0.12)" }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-800">
                          {c.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-10 pb-8 text-center text-xs text-slate-500">
          Quandr3 • Ask • Share • Decide
        </div>
      </div>
    </main>
  );
}
