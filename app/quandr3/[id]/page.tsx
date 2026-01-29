// app/quandr3/[id]/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";
import { COLORS } from "@/app/styles/colors";

type Quandr3Row = {
  id: string;
  category: string;
  title: string;
  context: string | null;
  options: string[];
  status: string;
  created_at: string;
  closes_at: string | null;
  resolution_window: string | null;
};

type VoteRow = {
  quandr3_id: string;
  user_id: string;
  choice_index: number;
};

export default function Quandr3DetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [q, setQ] = useState<Quandr3Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [userChoiceIndex, setUserChoiceIndex] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: quandr3, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id, category, title, context, options, status, created_at, closes_at, resolution_window"
        )
        .eq("id", id)
        .maybeSingle();

      if (qErr) {
        setError(qErr.message);
        setLoading(false);
        return;
      }
      if (!quandr3) {
        setError("This Quandr3 could not be found.");
        setLoading(false);
        return;
      }

      const typed = quandr3 as Quandr3Row;
      setQ(typed);

      const { data: votes, error: vErr } = await supabase
        .from("quandr3_votes")
        .select("quandr3_id, user_id, choice_index")
        .eq("quandr3_id", id);

      const optsCount = typed.options?.length || 0;
      const counts = new Array(optsCount).fill(0);
      let myChoice: number | null = null;

      if (!vErr && votes) {
        (votes as VoteRow[]).forEach((v) => {
          if (v.choice_index >= 0 && v.choice_index < optsCount) {
            counts[v.choice_index] += 1;
          }
          if (user && v.user_id === user.id) {
            myChoice = v.choice_index;
          }
        });
      }

      setVoteCounts(counts);
      setUserChoiceIndex(myChoice);
      setLoading(false);
    };

    loadData();
  }, [id]);

  const timeLabel = q ? buildTimeLabel(q) : "";

  const handleVote = async (idx: number) => {
    if (!q) return;
    if (!userId) {
      setVoteError("Please sign in to vote.");
      return;
    }
    if (q.status !== "open") {
      setVoteError("This Quandr3 is closed.");
      return;
    }
    if (userChoiceIndex !== null) {
      setVoteError("You’ve already voted.");
      return;
    }

    setVoting(true);
    setVoteError(null);

    const label = String.fromCharCode(65 + idx);

    const { error } = await supabase.from("quandr3_votes").insert({
      quandr3_id: q.id,
      user_id: userId,
      choice_index: idx,
      choice_label: label,
    });

    if (error) {
      setVoteError(error.message);
    } else {
      const newCounts = [...voteCounts];
      newCounts[idx] += 1;
      setVoteCounts(newCounts);
      setUserChoiceIndex(idx);
    }

    setVoting(false);
  };

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: COLORS.SOFT_BG,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        {/* TOP FILTER CHIPS */}
        <div className="mb-4 flex flex-wrap gap-2">
          {["Money", "Style", "Relationships"].map((cat) => (
            <span
              key={cat}
              className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
              style={{
                backgroundColor: COLORS.WHITE,
                border: `1px solid ${COLORS.BORDER}`,
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* BACK + VIEW ALL */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs font-semibold underline underline-offset-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            ← Back
          </button>

          <Link
            href="/quandr3"
            className="text-xs font-semibold underline underline-offset-2"
            style={{ color: COLORS.BLUE }}
          >
            View all Quandr3s
          </Link>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
            Loading…
          </div>
        )}

        {error && (
          <div
            className="text-sm rounded-xl px-4 py-3"
            style={{
              backgroundColor: COLORS.WHITE,
              border: `1px solid ${COLORS.CORAL}`,
              color: COLORS.CORAL,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && q && (
          <article
            className="rounded-2xl px-4 py-6 shadow-sm"
            style={{
              backgroundColor: COLORS.WHITE,
              border: `1px solid ${COLORS.BORDER}`,
            }}
          >
            {/* HEADER ROW (this is basically yesterday’s look) */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Category pill */}
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: COLORS.NAVY,
                    color: COLORS.WHITE,
                  }}
                >
                  {q.category}
                </span>

                {/* Status pill */}
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      q.status === "open"
                        ? COLORS.OVERLAY
                        : "rgba(11,35,67,0.04)",
                    color:
                      q.status === "open" ? COLORS.TEAL : COLORS.TEXT_PRIMARY,
                  }}
                >
                  {q.status}
                </span>
              </div>

              {/* Time left */}
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: COLORS.BLUE }}
              >
                {timeLabel}
              </span>
            </div>

            {/* TITLE */}
            <h1 className="text-xl font-bold mb-3">{q.title}</h1>

            {/* CONTEXT */}
            {q.context && (
              <p
                className="text-sm mb-4"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {q.context}
              </p>
            )}

            {/* OPTIONS */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">
                Options on the table
              </h2>

              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const isMine = userChoiceIndex === idx;
                  const hasVoted = userChoiceIndex !== null;

                  const total = voteCounts.reduce((s, n) => s + (n || 0), 0);
                  const count = voteCounts[idx] || 0;
                  const pct = total ? Math.round((count / total) * 100) : 0;

                  const disabled =
                    voting || q.status !== "open" || (hasVoted && !isMine);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleVote(idx)}
                      disabled={disabled}
                      className="w-full flex items-center justify-between rounded-full px-3 py-2 text-left text-sm transition-transform"
                      style={{
                        backgroundColor: isMine
                          ? COLORS.NAVY
                          : COLORS.WHITE,
                        color: isMine
                          ? COLORS.WHITE
                          : COLORS.TEXT_PRIMARY,
                        border: `1px solid ${
                          isMine ? COLORS.NAVY : COLORS.BORDER
                        }`,
                        opacity: disabled && !isMine ? 0.6 : 1,
                        cursor: disabled ? "default" : "pointer",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </span>

                      <span className="text-xs flex items-center gap-2">
                        {total > 0 && (
                          <span
                            style={{
                              color: isMine
                                ? "rgba(255,255,255,0.85)"
                                : COLORS.TEXT_SECONDARY,
                            }}
                          >
                            {count} · {pct}%
                          </span>
                        )}

                        {isMine && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide"
                            style={{
                              backgroundColor: isMine
                                ? "rgba(255,255,255,0.22)"
                                : COLORS.OVERLAY,
                            }}
                          >
                            Your choice
                          </span>
                        )}

                        {!total && !hasVoted && (
                          <span style={{ color: COLORS.TEXT_SECONDARY }}>
                            Tap to vote
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* VOTE FEEDBACK */}
              <div className="mt-3 text-xs">
                {voteError ? (
                  <span style={{ color: COLORS.CORAL }}>{voteError}</span>
                ) : userChoiceIndex === null ? (
                  <span style={{ color: COLORS.TEXT_SECONDARY }}>
                    Choose the option you’d go with. One vote per person.
                  </span>
                ) : (
                  <span style={{ color: COLORS.TEAL }}>
                    <strong>Thanks</strong> — your vote has been recorded and
                    highlighted above.
                  </span>
                )}
              </div>
            </section>

            {/* REASONING PLACEHOLDER */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">
                Reasoning from the crowd
              </h2>

              <p
                className="text-sm mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                This is where people’s reasoning will live — why they chose A,
                B, C, or D. We’ll show perspectives, not just percentages.
              </p>

              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{
                  backgroundColor: COLORS.SOFT_BG,
                  color: COLORS.TEXT_SECONDARY,
                  border: `1px solid ${COLORS.BORDER}`,
                }}
              >
                Commenting and full reasoning threads are in the works. For now,
                you’re seeing live Quandr3s exactly as others would.
              </div>
            </section>

            {/* FOOTER */}
            <section
              className="pt-3 text-xs border-t"
              style={{
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT_SECONDARY,
              }}
            >
              <div>
                Posted{" "}
                <span
                  className="font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {new Date(q.created_at).toLocaleString()}
                </span>
              </div>
              {q.resolution_window && (
                <div className="mt-1">
                  Decision window: <span>{q.resolution_window}</span>
                </div>
              )}
            </section>
          </article>
        )}
      </div>
    </main>
  );
}

function buildTimeLabel(q: Quandr3Row): string {
  if (!q.closes_at) return q.resolution_window || "";
  const now = new Date();
  const closes = new Date(q.closes_at);
  const diff = closes.getTime() - now.getTime();
  if (diff <= 0) return "Closed";
  const mins = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins} min left`;
  if (hours < 24) return `${hours} hours left`;
  return `${days} days left`;
}
