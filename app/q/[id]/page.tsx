// app/q/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Style
========================= */
const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const LETTER = ["A", "B", "C", "D"];

/* =========================
   Helpers
========================= */
function fmt(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
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

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function safeShare(url: string, title: string) {
  try {
    if ((navigator as any).share) {
      await (navigator as any).share({ title, url });
      return;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
  } catch {
    prompt("Copy this link:", url);
  }
}

function reportMailto(qid: string) {
  const subject = encodeURIComponent(`Report Quandr3: ${qid}`);
  const body = encodeURIComponent(
    `I’d like to report this Quandr3 for review.\n\nQuandr3 ID: ${qid}\nReason:\n`
  );
  return `mailto:support@quandr3.com?subject=${subject}&body=${body}`;
}

/* =========================
   Page
========================= */
export default function Quandr3DetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw: any = (params as any)?.id;
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
  const [commentProfilesById, setCommentProfilesById] = useState<
    Record<string, any>
  >({});

  // Curioso toggle
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  /* =========================
     Load Auth
  ========================= */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  /* =========================
     Refresh Helpers
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

    const userIds = Array.from(
      new Set(c.map((x: any) => x.user_id).filter(Boolean))
    );

    if (!userIds.length) {
      setCommentProfilesById({});
      return;
    }

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const map: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => (map[p.id] = p));
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

    // Voting ended?
    const duration = Number(qRow?.voting_duration_hours || 0);
    const createdAt = qRow?.created_at;

    const timeExpired =
      !!createdAt && !!duration
        ? Date.now() > new Date(createdAt).getTime() + duration * 3600 * 1000
        : false;

    const voteCapReached =
      qRow?.voting_max_votes ? vRows.length >= Number(qRow.voting_max_votes) : false;

    const votingEnded = timeExpired || voteCapReached || !!r;

    // ✅ Show discussion READ-ONLY to everyone AFTER close if author opened it.
    // Posting is gated later (voters only).
    if (qRow?.discussion_open && votingEnded) {
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
     Derived
  ========================= */
  const myVote = useMemo(() => {
    if (!user) return null;
    return votes.find((v: any) => v.user_id === user.id) ?? null;
  }, [votes, user]);

  const didVote = useMemo(() => !!myVote?.id, [myVote]);

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

  const canShowResults = status !== "open";

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

  const canEditReason = !!user && status === "open" && !votingExpired && !resolution;

  const isCurioso = useMemo(() => {
    if (!user?.id || !q?.author_id) return false;
    return user.id === q.author_id;
  }, [user, q]);

  const canToggleDiscussion = useMemo(() => {
    if (!isCurioso) return false;
    // Curioso can open/close discussion after voting ends OR after resolution
    return votingExpired || !!resolution;
  }, [isCurioso, votingExpired, resolution]);

  // ✅ Discussion visibility rule (read-only for non-voters)
  const discussionVisible = useMemo(() => {
    return status !== "open" && !!q?.discussion_open;
  }, [status, q]);

  const canPostDiscussion = useMemo(() => {
    // only voters can post
    return discussionVisible && !!user && didVote;
  }, [discussionVisible, user, didVote]);

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
      .insert({ quandr3_id: id, user_id: user.id, choice_index: order })
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
      .upsert({ vote_id: myVote.id, reason: draft }, { onConflict: "vote_id" });

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
    if (!canPostDiscussion) return;

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
            <div className="mt-2 text-sm text-slate-600">Pulling votes, options, and context.</div>
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
            <div className="mt-2 text-sm text-slate-600">This Quandr3 doesn’t exist.</div>
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

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : `https://quandr3.vercel.app/q/${id}`;

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-extrabold" style={{ color: NAVY }}>
              Quandr3
            </Link>
            <span className="text-xs tracking-widest text-slate-500">ASK • SHARE • DECIDE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm font-semibold text-slate-700 hover:underline">
              Explore
            </Link>
            <Link
              href="/q/create"
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm"
              style={{ background: `linear-gradient(90deg, ${BLUE}, ${TEAL})` }}
            >
              Create a Quandr3
            </Link>
            {!user ? (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:underline">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Hero card */}
        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-widest text-slate-600">
                REAL PEOPLE. REAL DILEMMAS.
              </div>

              <h1 className="mt-2 text-3xl font-extrabold" style={{ color: NAVY }}>
                {q.title || "Untitled Quandr3"}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div
                    className="h-10 w-10 overflow-hidden rounded-full border"
                    style={{ background: "rgba(15,23,42,0.06)" }}
                    title={profile?.display_name ?? "Curioso"}
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">
                        ?
                      </div>
                    )}
                  </div>
                  <div>
                    <div>
                      Asked by{" "}
                      <span className="font-semibold" style={{ color: NAVY }}>
                        {profile?.display_name ?? "Unknown"}
                      </span>{" "}
                      • {fmt(q.created_at)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Category: <span className="font-semibold">{q.category || "General"}</span>
                    </div>
                  </div>
                </div>

                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background:
                      status === "resolved"
                        ? "rgba(0,169,165,0.12)"
                        : status === "awaiting_user"
                        ? "rgba(255,107,107,0.12)"
                        : "rgba(30,99,243,0.12)",
                    color: status === "resolved" ? TEAL : status === "awaiting_user" ? CORAL : BLUE,
                  }}
                >
                  {status.toUpperCase()}
                </span>

                <span className="text-xs text-slate-600">
                  {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                  {status === "open" ? (
                    <> • {hoursLeft(q.created_at, q.voting_duration_hours)}h left</>
                  ) : null}
                </span>
              </div>

              {q.reasoning ? (
                <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-600">
                    WHY I’M ASKING
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{q.reasoning}</div>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => safeShare(pageUrl, q.title || "Quandr3")}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Share
              </button>
              <a
                href={reportMailto(id)}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Report
              </a>

              {status !== "open" ? (
                <Link
                  href={`/q/${id}/results`}
                  className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                  style={{ background: BLUE }}
                >
                  View Results
                </Link>
              ) : null}

              {/* Curioso-only shortcut */}
              {isCurioso ? (
                <Link
                  href={`/q/${id}/resolve`}
                  className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                  style={{ background: CORAL }}
                >
                  Resolve
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {options.map((opt: any) => {
            const count = voteCounts[opt.order] || 0;
            const p = pct(count, totalVotes);
            const optReasons = reasonsByChoiceIndex[opt.order] ?? [];

            const isMyPicked = myVote?.choice_index === opt.order;
            const showReasonBox = !!myVote?.id && isMyPicked && canEditReason;
            const voteIdForMyVote = myVote?.id;
            const reasonDraft =
              voteIdForMyVote != null
                ? (reasonDraftByVoteId[voteIdForMyVote] ?? cleanReason(reasonsByVoteId[voteIdForMyVote] ?? ""))
                : "";

            return (
              <div key={opt.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm">
                {/* image */}
                <div className="relative h-40 w-full bg-slate-100">
                  {opt.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                      {q.category || "Category"} placeholder
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-extrabold"
                      style={{ background: "rgba(255,255,255,0.85)", color: NAVY }}
                    >
                      {LETTER[opt.order - 1] ?? "?"}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.85)", color: BLUE }}
                    >
                      {q.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                        {opt.label}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {status === "open"
                          ? "Vote to help the Curioso decide."
                          : `${count} vote${count === 1 ? "" : "s"} • ${p}%`}
                      </div>
                    </div>

                    {status === "open" ? (
                      <button
                        onClick={() => vote(opt.order)}
                        className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                        style={{ background: isMyPicked ? TEAL : BLUE }}
                      >
                        {isMyPicked ? "Voted" : "Vote"}
                      </button>
                    ) : (
                      <div
                        className="rounded-xl px-4 py-2 text-sm font-extrabold"
                        style={{
                          background: "rgba(15,23,42,0.06)",
                          color: NAVY,
                        }}
                      >
                        Closed
                      </div>
                    )}
                  </div>

                  {/* results bar */}
                  {canShowResults ? (
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p}%`,
                          background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`,
                        }}
                      />
                    </div>
                  ) : null}

                  {/* reasons preview after close */}
                  {canShowResults && optReasons.length > 0 ? (
                    <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-600">
                        WHY PEOPLE CHOSE THIS
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                        {optReasons.slice(0, 4).map((txt: string, idx: number) => (
                          <li key={`${opt.id}-r-${idx}`}>{txt}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* write reason while open */}
                  {showReasonBox ? (
                    <div className="mt-4 rounded-2xl border bg-white p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-600">
                        YOUR REASON (OPTIONAL)
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
                          className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                          style={{ background: TEAL }}
                        >
                          {savingReason ? "Saving…" : "Save reason"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Discussion */}
        <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">DISCUSSION</div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: NAVY }}>
                After the decision, the learning continues
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Discussion only happens after voting ends, and only if the Curioso opens it.
                <span className="font-semibold"> Voters can post</span>; everyone else can read.
              </div>
            </div>

            {isCurioso ? (
              <div className="flex gap-2">
                {!canToggleDiscussion ? (
                  <div className="text-xs text-slate-500">
                    (You can open discussion after voting ends.)
                  </div>
                ) : q.discussion_open ? (
                  <button
                    onClick={() => setDiscussionOpen(false)}
                    disabled={togglingDiscussion}
                    className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                    style={{ background: CORAL }}
                  >
                    {togglingDiscussion ? "Closing…" : "Close"}
                  </button>
                ) : (
                  <button
                    onClick={() => setDiscussionOpen(true)}
                    disabled={togglingDiscussion}
                    className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                    style={{ background: TEAL }}
                  >
                    {togglingDiscussion ? "Opening…" : "Open"}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {status === "open" ? (
            <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
              Discussion opens after voting closes.
            </div>
          ) : !q.discussion_open ? (
            <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
              Discussion is closed.
            </div>
          ) : (
            <>
              {/* Post box */}
              <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                {!user ? (
                  <div className="text-sm text-slate-700">
                    Log in to see if you’re invited to post. (You can still read below.)
                    <div className="mt-3">
                      <Link
                        href={`/login?next=/q/${id}`}
                        className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                        style={{ background: BLUE }}
                      >
                        Log in
                      </Link>
                    </div>
                  </div>
                ) : !didVote ? (
                  <div className="text-sm text-slate-700">
                    You can read this discussion, but only voters can post.
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold tracking-widest text-slate-600">
                      ADD TO THE DISCUSSION
                    </div>
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2"
                      style={{ borderColor: "rgba(15,23,42,0.12)" }}
                      placeholder="Share your take (keep it respectful)."
                      disabled={postingComment}
                    />
                    <div className="mt-2">
                      <button
                        onClick={postComment}
                        disabled={postingComment}
                        className="rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                        style={{ background: TEAL }}
                      >
                        {postingComment ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Comment list (readable by anyone once open) */}
              <div className="mt-5 space-y-3">
                {comments.length === 0 ? (
                  <div className="text-sm text-slate-600">No comments yet.</div>
                ) : (
                  comments.map((c: any) => {
                    const p = commentProfilesById[c.user_id];
                    const canDelete = user?.id && c.user_id === user.id;

                    return (
                      <div key={c.id} className="rounded-2xl border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 overflow-hidden rounded-full border"
                              style={{ background: "rgba(15,23,42,0.06)" }}
                            >
                              {p?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">
                                  ?
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                                {p?.display_name ?? "Member"}
                              </div>
                              <div className="text-xs text-slate-500">{fmt(c.created_at)}</div>
                            </div>
                          </div>

                          {canDelete ? (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="rounded-xl border bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                          {c.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          Quandr3 • Ask • Share • Decide
        </div>
      </div>
    </main>
  );
}
