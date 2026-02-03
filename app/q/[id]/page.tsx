// app/q/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

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

const LETTER = ["A", "B", "C", "D"];

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

  const isDevOnly = useMemo(() => process.env.NODE_ENV !== "production", []);

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

  // Discussion (B)
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentProfilesById, setCommentProfilesById] = useState<
    Record<string, any>
  >({});

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
  }, [id, user?.id]); // ✅ re-evaluate invite gating after login loads

  /* =========================
     Derived Logic
  ========================= */

  const myVote = useMemo(() => {
    if (!user) return null;
    return votes.find((v: any) => v.user_id === user.id) ?? null;
  }, [votes, user]);

  const didVote = useMemo(() => {
    return !!myVote?.id;
  }, [myVote]);

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

  const canShowResults = useMemo(() => {
    // Results is for closed quandr3s (awaiting_user or resolved)
    return status !== "open";
  }, [status]);

  const canShowDiscussion = useMemo(() => {
    // ✅ your rule:
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

  // Only allow editing reasons while voting is open (not expired, not resolved)
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

    // ✅ mark “invited” locally too (optional but useful)
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

    // ✅ enforce invite rule client-side too
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

    const { error } = await supabase
      .from("quandr3_comments")
      .delete()
      .eq("id", commentId);

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

    // Always re-pull the core row so UI is 100% consistent
    await refreshCore(id);
  }

  /* =========================
     Render
  ========================= */

  if (loading) return <div>Loading…</div>;
  if (!q) return <div>Not found</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/explore">Browse Quandr3s</Link>
          <Link href="/q/create">Create Quandr3</Link>
        </div>

        {/* ✅ DEV-only shortcuts */}
        {isDevOnly && id ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#666" }}>DEV:</span>
            <Link href={`/q/${id}/resolve?dev=1`} style={{ fontSize: 12 }}>
              Resolve Preview
            </Link>
            <Link href={`/q/${id}/results?dev=1`} style={{ fontSize: 12 }}>
              Results Preview
            </Link>
          </div>
        ) : null}
      </div>

      {/* Header */}
      <h1 style={{ marginTop: 18 }}>{q.title}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        {/* Avatar (simple MVP) */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "#eee",
            overflow: "hidden",
          }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>

        <div>
          <div>
            Asked by <strong>{profile?.display_name ?? "Unknown"}</strong> •{" "}
            {fmt(q.created_at)}
          </div>
          <div>
            Category: <strong>{q.category}</strong>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginTop: 14 }}>
        Status: <strong>{status}</strong> • {totalVotes}{" "}
        {totalVotes === 1 ? "vote" : "votes"}
        {status === "open" && (
          <> • {hoursLeft(q.created_at, q.voting_duration_hours)}h left</>
        )}
      </div>

      {/* Curioso Reasoning */}
      {q.reasoning && (
        <div style={{ marginTop: 16 }}>
          <h3>Why I asked this</h3>
          <p>{q.reasoning}</p>
        </div>
      )}

      {/* Options */}
      <div style={{ marginTop: 24 }}>
        {options.map((opt: any) => {
          const count = voteCounts[opt.order] || 0;
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

          const isWinner = opt.order === winningOrder;
          const optReasons = reasonsByChoiceIndex[opt.order] ?? [];
          const isMyPicked = myVote?.choice_index === opt.order;

          // Only show reason box if voting is currently open AND this is my pick
          const showReasonBox = !!myVote?.id && isMyPicked && canEditReason;

          const voteIdForMyVote = myVote?.id;

          const reasonDraft =
            voteIdForMyVote != null
              ? (reasonDraftByVoteId[voteIdForMyVote] ?? myReason ?? "")
              : "";

          return (
            <div
              key={opt.id}
              style={{
                border: "1px solid #ddd",
                padding: 14,
                marginBottom: 12,
                background: isWinner ? "#f0f7ff" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {LETTER[opt.order - 1]}. {opt.label}
                </strong>

                {status === "open" ? (
                  <button onClick={() => vote(opt.order)}>Vote</button>
                ) : (
                  <div>
                    {count} votes ({pct}%)
                  </div>
                )}
              </div>

              {/* Only show when there are real reasons */}
              {optReasons.length > 0 && canShowResults && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Why people chose this
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {optReasons.slice(0, 5).map((txt: string, idx: number) => (
                      <li key={`${opt.id}-r-${idx}`}>{txt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reason UI (only for the voter, only while voting is open) */}
              {showReasonBox && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {myReason ? "Edit your reason" : "Why did you choose this?"}
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
                    style={{ width: "100%", padding: 10 }}
                    placeholder="Write a short reason (1–2 sentences is perfect)."
                  />

                  <div style={{ marginTop: 8 }}>
                    <button onClick={saveMyReason} disabled={savingReason}>
                      {savingReason ? "Saving..." : "Save reason"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resolution */}
      {resolution && (
        <div style={{ marginTop: 24 }}>
          <h3>Curioso Resolution</h3>
          <p>{resolution.note}</p>
          <div>Resolved on {fmt(resolution.created_at)}</div>
        </div>
      )}

      {/* =========================
          Discussion (GATED)
         ========================= */}

      <div style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Discussion</h3>

          {/* Curioso Open/Close buttons (only after close) */}
          {isCurioso && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!canToggleDiscussion ? (
                <div style={{ fontSize: 12, color: "#666" }}>
                  (You can open discussion after voting ends.)
                </div>
              ) : q.discussion_open ? (
                <button
                  onClick={() => setDiscussionOpen(false)}
                  disabled={togglingDiscussion}
                >
                  {togglingDiscussion ? "Closing..." : "Close Discussion"}
                </button>
              ) : (
                <button
                  onClick={() => setDiscussionOpen(true)}
                  disabled={togglingDiscussion}
                >
                  {togglingDiscussion ? "Opening..." : "Open Discussion"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rule 1: never show discussion while open */}
        {status === "open" ? (
          <div style={{ color: "#666", marginTop: 8 }}>
            Discussion opens after voting closes.
          </div>
        ) : !q.discussion_open ? (
          <div style={{ color: "#666", marginTop: 8 }}>Discussion is closed.</div>
        ) : !user ? (
          <div style={{ color: "#666", marginTop: 8 }}>
            Log in to see if you’re invited to the discussion.
          </div>
        ) : !didVote ? (
          <div style={{ color: "#666", marginTop: 8 }}>
            Discussion is for voters only on this Quandr3.
          </div>
        ) : (
          <>
            {/* ✅ Only reaches here if: closed + discussion_open + user voted */}

            {/* Add comment */}
            <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Add to the discussion
              </div>

              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 10 }}
                placeholder="Share your take (keep it respectful)."
                disabled={postingComment}
              />

              <div style={{ marginTop: 8 }}>
                <button onClick={postComment} disabled={postingComment}>
                  {postingComment ? "Posting..." : "Post comment"}
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div style={{ marginTop: 14 }}>
              {comments.length === 0 ? (
                <div style={{ color: "#666" }}>No comments yet.</div>
              ) : (
                comments.map((c: any) => {
                  const p = commentProfilesById[c.user_id];
                  const canDelete = user?.id && c.user_id === user.id;

                  return (
                    <div
                      key={c.id}
                      style={{
                        border: "1px solid #eee",
                        padding: 12,
                        marginBottom: 10,
                        background: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 999,
                              background: "#eee",
                              overflow: "hidden",
                            }}
                          >
                            {p?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.avatar_url}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : null}
                          </div>

                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {p?.display_name ?? "Member"}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {fmt(c.created_at)}
                            </div>
                          </div>
                        </div>

                        {canDelete ? (
                          <button onClick={() => deleteComment(c.id)}>Delete</button>
                        ) : null}
                      </div>

                      <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
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
    </div>
  );
}
