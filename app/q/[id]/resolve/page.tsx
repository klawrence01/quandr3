// C:\Users\klawr\quandr3\app\q\[id]\resolve\page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Styling
========================= */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

/* =========================
   Helpers
========================= */

function fmt(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function cleanReason(s?: string) {
  if (!s) return "";
  const t = String(s).trim();
  if (!t) return "";
  if (t.toUpperCase() === "UPDATED TEXT HERE") return "";
  return t;
}

const LETTER = ["A", "B", "C", "D"];

/* =========================
   Page
========================= */

export default function ResolvedPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw: any = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // vote reasons (for “why people chose”)
  const [reasonsByVoteId, setReasonsByVoteId] = useState<Record<string, string>>(
    {}
  );

  // discussion
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentProfilesById, setCommentProfilesById] = useState<Record<string, any>>(
    {}
  );

  // Curioso toggle discussion
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  // UI toast-ish
  const [justCopied, setJustCopied] = useState<string>("");

  /* =========================
     Auth
  ========================= */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  /* =========================
     Load helpers
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
    const { data: qRow } = await supabase.from("quandr3s").select("*").eq("id", qid).single();
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

    // ✅ Resolved page: everyone can view discussion, BUT only voters can post.
    // Only load comments if Curioso opened discussion AND resolution exists.
    if (qRow?.discussion_open && !!r) {
      await refreshComments(qid);
    } else {
      setComments([]);
      setCommentDraft("");
      setCommentProfilesById({});
    }

    return { qRow, vRows, r };
  }

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const { qRow, r } = await refreshCore(id);
      setLoading(false);

      // ✅ If not resolved yet, this page should NOT be used.
      // Users should be on /q/[id] to see voting or “Internet Decided”.
      if (!r || qRow?.status !== "resolved") {
        router.replace(`/q/${id}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  /* =========================
     Derived
  ========================= */

  const totalVotes = votes.length;

  const didVote = useMemo(() => {
    if (!user?.id) return false;
    return votes.some((v: any) => v.user_id === user.id);
  }, [votes, user]);

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

  const isCurioso = useMemo(() => {
    if (!user?.id || !q?.author_id) return false;
    return user.id === q.author_id;
  }, [user, q]);

  const winnerOrder = useMemo(() => {
    if (!resolution) return null;
    const opt = options.find((o: any) => o.id === resolution.option_id);
    return opt?.order ?? null;
  }, [resolution, options]);

  /* =========================
     Actions
  ========================= */

  async function setDiscussionOpen(nextOpen: boolean) {
    if (!id) return;
    if (!user) {
      router.push(`/login?next=/q/${id}/resolve`);
      return;
    }
    if (!isCurioso) return;

    setTogglingDiscussion(true);

    const { error } = await supabase.from("quandr3s").update({ discussion_open: nextOpen }).eq("id", id);

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

  async function postComment() {
    if (!id) return;
    if (!user) {
      router.push(`/login?next=/q/${id}/resolve`);
      return;
    }

    // ✅ enforce: only voters can post
    if (!didVote) return;
    if (!q?.discussion_open) return;
    if (!resolution) return;

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
      router.push(`/login?next=/q/${id}/resolve`);
      return;
    }

    const { error } = await supabase.from("quandr3_comments").delete().eq("id", commentId);

    if (error) {
      alert(error.message || "Could not delete comment.");
      return;
    }

    await refreshComments(id);
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const ok = copyToClipboard(url);
    setJustCopied(ok ? "Link copied!" : "Could not copy.");
    window.setTimeout(() => setJustCopied(""), 1200);
  }

  function handleReport() {
    // Phase 1: simple mailto stub (no backend)
    const url = typeof window !== "undefined" ? window.location.href : "";
    const subject = encodeURIComponent("Report a Quandr3");
    const body = encodeURIComponent(`I want to report this Quandr3:\n\n${url}\n\nReason:\n`);
    window.location.href = `mailto:support@quandr3.com?subject=${subject}&body=${body}`;
  }

  /* =========================
     Render
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading resolved page…
            </div>
            <div className="mt-2 text-sm text-slate-600">Pulling results and final outcome.</div>
          </div>
        </div>
      </main>
    );
  }

  if (!q) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm font-semibold" style={{ color: NAVY }}>
              ← Explore
            </Link>
            <Link href={`/q/${id}`} className="text-sm text-slate-600 hover:underline">
              View public page
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReport}
              className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Report
            </button>
            <button
              onClick={handleShare}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: BLUE }}
            >
              Share
            </button>
          </div>
        </div>

        {justCopied ? (
          <div className="mt-3 text-xs font-semibold" style={{ color: TEAL }}>
            {justCopied}
          </div>
        ) : null}

        {/* Header card */}
        <div className="mt-5 rounded-3xl border bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-widest text-slate-500">RESOLVED</div>
              <h1 className="mt-2 text-2xl font-extrabold" style={{ color: NAVY }}>
                {q.title}
              </h1>

              <div className="mt-3 flex items-center gap-12">
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden"
                      title="Curioso"
                    >
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm text-slate-700">
                        Asked by{" "}
                        <span className="font-bold" style={{ color: NAVY }}>
                          {profile?.display_name ?? "Unknown"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{fmt(q.created_at)}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    Category:{" "}
                    <span className="font-semibold" style={{ color: NAVY }}>
                      {q.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Votes:{" "}
                    <span className="font-semibold" style={{ color: NAVY }}>
                      {totalVotes}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner pill */}
            {winnerOrder ? (
              <div className="shrink-0">
                <div
                  className="rounded-full px-4 py-2 text-xs font-extrabold text-white"
                  style={{ background: TEAL }}
                >
                  Final choice: {LETTER[winnerOrder - 1]}
                </div>
                <div className="mt-2 text-xs text-slate-500 text-right">
                  Resolved {fmt(resolution?.created_at)}
                </div>
              </div>
            ) : null}
          </div>

          {/* Curioso “Why I asked” */}
          {q.reasoning ? (
            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-600">WHY I ASKED</div>
              <div className="mt-2 text-sm text-slate-700">{q.reasoning}</div>
            </div>
          ) : null}

          {/* Curioso Resolution note */}
          {resolution?.note ? (
            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "rgba(0,169,165,0.35)" }}>
              <div className="text-xs font-semibold tracking-widest" style={{ color: TEAL }}>
                FINAL NOTE
              </div>
              <div className="mt-2 text-sm text-slate-800">{resolution.note}</div>
            </div>
          ) : null}
        </div>

        {/* Results list */}
        <div className="mt-6 rounded-3xl border bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">RESULTS</div>
              <div className="mt-2 text-lg font-extrabold" style={{ color: NAVY }}>
                How people voted
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Reasons are shown when available.
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {options.map((opt: any) => {
              const count = voteCounts[opt.order] || 0;
              const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
              const isWinner = winnerOrder ? opt.order === winnerOrder : false;
              const optReasons = reasonsByChoiceIndex[opt.order] ?? [];

              return (
                <div
                  key={opt.id}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: isWinner ? "rgba(0,169,165,0.45)" : "rgba(15,23,42,0.12)",
                    background: isWinner ? "rgba(0,169,165,0.06)" : "white",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                        {LETTER[opt.order - 1]}. {opt.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {count} vote{count === 1 ? "" : "s"} • {pct}%
                      </div>
                    </div>

                    {isWinner ? (
                      <div
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "rgba(0,169,165,0.18)", color: TEAL }}
                      >
                        Final Choice
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: isWinner ? TEAL : BLUE }}
                    />
                  </div>

                  {optReasons.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-slate-700">Why people chose this</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                        {optReasons.slice(0, 5).map((txt: string, idx: number) => (
                          <li key={`${opt.id}-r-${idx}`}>{txt}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Discussion */}
        <div className="mt-6 rounded-3xl border bg-white p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">DISCUSSION</div>
              <div className="mt-2 text-lg font-extrabold" style={{ color: NAVY }}>
                After-resolve discussion
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Everyone can read. Only voters can post.
              </div>
            </div>

            {/* Curioso controls */}
            {isCurioso ? (
              <div className="flex gap-2">
                {q.discussion_open ? (
                  <button
                    onClick={() => setDiscussionOpen(false)}
                    disabled={togglingDiscussion}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: CORAL }}
                  >
                    {togglingDiscussion ? "Closing…" : "Close discussion"}
                  </button>
                ) : (
                  <button
                    onClick={() => setDiscussionOpen(true)}
                    disabled={togglingDiscussion}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: TEAL }}
                  >
                    {togglingDiscussion ? "Opening…" : "Open discussion"}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {!q.discussion_open ? (
            <div className="mt-4 text-sm text-slate-600">Discussion is closed.</div>
          ) : (
            <>
              {/* Post box */}
              {!user ? (
                <div className="mt-4 text-sm text-slate-600">
                  Log in to see if you can post (voters only).
                </div>
              ) : !didVote ? (
                <div className="mt-4 text-sm text-slate-600">
                  You can read this discussion, but posting is for voters only.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                  <div className="text-sm font-bold" style={{ color: NAVY }}>
                    Add to the discussion
                  </div>

                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-xl border bg-white p-3 text-sm"
                    placeholder="Share your take (keep it respectful)."
                    disabled={postingComment}
                    style={{ borderColor: "rgba(15,23,42,0.12)" }}
                  />

                  <div className="mt-3">
                    <button
                      onClick={postComment}
                      disabled={postingComment}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      style={{ background: BLUE }}
                    >
                      {postingComment ? "Posting…" : "Post comment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments list */}
              <div className="mt-5">
                {comments.length === 0 ? (
                  <div className="text-sm text-slate-600">No comments yet.</div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c: any) => {
                      const p = commentProfilesById[c.user_id];
                      const canDelete = user?.id && c.user_id === user.id;

                      return (
                        <div
                          key={c.id}
                          className="rounded-2xl border bg-white p-4"
                          style={{ borderColor: "rgba(15,23,42,0.10)" }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                                {p?.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
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
                                className="text-xs font-semibold text-slate-600 hover:underline"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">
                            {c.body}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
