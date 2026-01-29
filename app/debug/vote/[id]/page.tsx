// app/debug/vote/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

type VoteRow = {
  id: string;
  quandr3_id: string;
  user_id: string;
  choice_index: number;
  choice_label: string | null;
  reason: string | null;
  created_at: string;
};

type AggregatedResults = {
  totalVotes: number;
  counts: number[]; // one per choice index
  winningIndex: number | null;
  winningReasons: string[]; // reasons for the winning choice
  losingReasons: { choiceIndex: number; reason: string }[];
};

const CHOICES = [
  { index: 0, letter: "A", label: "Greece" },
  { index: 1, letter: "B", label: "Rome" },
  { index: 2, letter: "C", label: "New York" },
  { index: 3, letter: "D", label: "Paris" },
];

const TOTAL_CHOICES = CHOICES.length;

export default function VoteOnQuandr3Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const rawId = params?.id;
  const QUANDR3_ID =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<AggregatedResults | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // ---------------------------
  // Helper: compute results
  // ---------------------------
  function computeResults(votes: VoteRow[]): AggregatedResults {
    const counts = new Array(TOTAL_CHOICES).fill(0);
    const winningReasons: string[] = [];
    const losingReasons: { choiceIndex: number; reason: string }[] = [];

    for (const v of votes) {
      if (
        typeof v.choice_index === "number" &&
        v.choice_index >= 0 &&
        v.choice_index < TOTAL_CHOICES
      ) {
        counts[v.choice_index] += 1;
      }
    }

    const totalVotes = votes.length;

    let winningIndex: number | null = null;
    let bestCount = -1;
    counts.forEach((count, idx) => {
      if (count > bestCount) {
        bestCount = count;
        winningIndex = idx;
      }
    });

    if (winningIndex !== null) {
      for (const v of votes) {
        if (!v.reason) continue;

        if (v.choice_index === winningIndex) {
          winningReasons.push(v.reason);
        } else {
          losingReasons.push({
            choiceIndex: v.choice_index,
            reason: v.reason,
          });
        }
      }
    }

    return {
      totalVotes,
      counts,
      winningIndex,
      winningReasons,
      losingReasons,
    };
  }

  // ---------------------------
  // Load existing votes + see if user already voted
  // ---------------------------
  useEffect(() => {
    if (!QUANDR3_ID) return;

    async function load() {
      try {
        // 1) load all votes for this Quandr3 (anyone can see results)
        const { data: voteData, error: voteError } = await supabase
          .from("quandr3_votes")
          .select("*")
          .eq("quandr3_id", QUANDR3_ID)
          .order("created_at", { ascending: true });

        if (voteError) {
          console.error("Failed to load votes", voteError);
        } else {
          const votes = (voteData ?? []) as VoteRow[];
          setResults(computeResults(votes));
        }

        // 2) see if current user has already voted
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (user) {
          const { data: existingVoteData, error: existingVoteError } =
            await supabase
              .from("quandr3_votes")
              .select("*")
              .eq("quandr3_id", QUANDR3_ID)
              .eq("user_id", user.id)
              .maybeSingle();

          if (!existingVoteError && existingVoteData) {
            const v = existingVoteData as VoteRow;
            setHasVoted(true);
            if (
              typeof v.choice_index === "number" &&
              v.choice_index >= 0 &&
              v.choice_index < TOTAL_CHOICES
            ) {
              setSelectedIndex(v.choice_index);
            }
          }
        }
      } finally {
        setInitialLoading(false);
      }
    }

    load();
  }, [QUANDR3_ID]);

  // ---------------------------
  // Handle submit
  // ---------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (submitting) return;
    if (!QUANDR3_ID) {
      setError("Missing Quandr3 ID.");
      return;
    }
    if (selectedIndex === null) {
      setError("Please choose an option.");
      return;
    }

    setSubmitting(true);

    try {
      // 1) check auth
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setSubmitting(false);

        // 🚪 Not signed in → send to account with redirect back to this page
        const redirectTarget = pathname || `/debug/vote/${QUANDR3_ID}`;
        router.push(`/account?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }

      const user = userData.user;

      // 2) check if this user already has a vote on this quandr3
      const { data: existingVoteData, error: existingVoteError } = await supabase
        .from("quandr3_votes")
        .select("*")
        .eq("quandr3_id", QUANDR3_ID)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingVoteError && existingVoteData) {
        // Already voted – do NOT insert another one
        setHasVoted(true);

        // Refresh results so the user sees latest numbers
        const { data: voteData, error: voteError } = await supabase
          .from("quandr3_votes")
          .select("*")
          .eq("quandr3_id", QUANDR3_ID)
          .order("created_at", { ascending: true });

        if (!voteError && voteData) {
          setResults(computeResults(voteData as VoteRow[]));
        }

        setError("You’ve already voted on this Quandr3.");
        setSubmitting(false);
        return;
      }

      // 3) Insert new vote
      const choiceDef = CHOICES.find((c) => c.index === selectedIndex);

      const insertPayload = {
        quandr3_id: QUANDR3_ID,
        user_id: user.id,
        choice_index: selectedIndex,
        choice_label: choiceDef?.label ?? null,
        reason: reason.trim() ? reason.trim() : null,
      };

      const { error: insertError } = await supabase
        .from("quandr3_votes")
        .insert(insertPayload);

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      // 4) Reload results after successful insert
      const { data: voteData, error: voteError } = await supabase
        .from("quandr3_votes")
        .select("*")
        .eq("quandr3_id", QUANDR3_ID)
        .order("created_at", { ascending: true });

      if (!voteError && voteData) {
        setResults(computeResults(voteData as VoteRow[]));
      }

      setHasVoted(true);
      setSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while submitting your vote.");
      setSubmitting(false);
    }
  }

  // ---------------------------
  // Rendering helpers
  // ---------------------------
  function renderChoiceRow(choiceIndex: number) {
    const choice = CHOICES[choiceIndex];
    const isSelected = selectedIndex === choiceIndex;

    return (
      <button
        key={choice.index}
        type="button"
        onClick={() => setSelectedIndex(choice.index)}
        style={{
          width: "100%",
          textAlign: "left",
          marginBottom: 12,
          padding: "18px 20px",
          borderRadius: 999,
          border: isSelected ? `2px solid ${BLUE}` : "2px solid #e2e6f0",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: "2px solid #0b2343",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {choice.letter}
        </span>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{choice.label}</span>
      </button>
    );
  }

  function renderResults() {
    if (!results) return null;

    const { totalVotes, counts, winningIndex, winningReasons, losingReasons } =
      results;

    return (
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          Thanks for voting!
        </h2>
        <p style={{ marginBottom: 24, color: "#444" }}>
          Here&apos;s how everyone answered so far.
        </p>

        {/* Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CHOICES.map((choice) => {
            const count = counts[choice.index] ?? 0;
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isWinner = winningIndex === choice.index;

            return (
              <div
                key={choice.index}
                style={{
                  borderRadius: 16,
                  padding: "16px 18px",
                  border: isWinner
                    ? `2px solid ${BLUE}`
                    : "2px solid rgba(15, 23, 42, 0.08)",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: "2px solid #0b2343",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {choice.letter}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      {choice.label}
                    </span>
                    {isWinner && totalVotes > 0 && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#10b9811a",
                          color: "#059669",
                          textTransform: "uppercase",
                        }}
                      >
                        Top choice
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {pct}%{" "}
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>
                      ({count})
                    </span>
                  </span>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 999,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${pct}%`,
                      borderRadius: 999,
                      background: BLUE,
                      transition: "width 200ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Voices */}
        <div style={{ marginTop: 32 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Voices of the winning choice
          </h3>
          {winningIndex !== null && (
            <p style={{ marginBottom: 8, fontWeight: 600 }}>
              Why people chose {CHOICES[winningIndex].label}:
            </p>
          )}
          {winningReasons.length === 0 ? (
            <p style={{ color: "#555" }}>No written reasons yet.</p>
          ) : (
            <ul
              style={{
                marginTop: 4,
                paddingLeft: 18,
                color: "#111827",
              }}
            >
              {winningReasons.map((r, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Voices of the other options
          </h3>
          {losingReasons.length === 0 ? (
            <p style={{ color: "#555" }}>
              No written reasons yet from the other options.
            </p>
          ) : (
            <ul
              style={{
                marginTop: 4,
                paddingLeft: 18,
                color: "#111827",
              }}
            >
              {losingReasons.map((entry, idx) => {
                const c = CHOICES[entry.choiceIndex];
                return (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <strong>{c?.label ?? "Other"}</strong>: {entry.reason}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  }

  // ---------------------------
  // Main render
  // ---------------------------
  if (!QUANDR3_ID) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
        }}
      >
        <p>Missing Quandr3 ID in the URL.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px 80px",
        background: SOFT_BG,
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 24,
          padding: 32,
          boxShadow: "0 30px 60px rgba(15, 23, 42, 0.10)",
        }}
      >
        {/* Header / Question Card */}
        <section
          style={{
            background: "#f1f5ff",
            borderRadius: 18,
            padding: "18px 20px",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: BLUE,
              marginBottom: 8,
            }}
          >
            Relationships · Open
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 6,
              color: NAVY,
            }}
          >
            What is the most romantic city in the world?
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14 }}>
            Thinking of taking my wife on a trip to celebrate our anniversary.
          </p>
        </section>

        {/* Either the form OR the results */}
        {initialLoading ? (
          <p>Loading…</p>
        ) : hasVoted ? (
          renderResults()
        ) : (
          <form onSubmit={handleSubmit}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 16,
              }}
            >
              Your vote
            </h2>

            <div style={{ marginBottom: 20 }}>
              {CHOICES.map((c) => renderChoiceRow(c.index))}
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Your reasoning{" "}
                <span style={{ fontWeight: 400, color: "#6b7280" }}>
                  (optional)
                </span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid #d1d5db",
                  fontFamily: "system-ui",
                  fontSize: 14,
                  resize: "vertical",
                }}
                placeholder="Tell people why you chose your answer..."
              />
            </div>

            {error && (
              <p
                style={{
                  marginTop: 10,
                  color: "#b91c1c",
                  fontSize: 14,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 20,
                padding: "12px 24px",
                borderRadius: 999,
                background: submitting ? "#93c5fd" : BLUE,
                color: "#fff",
                fontWeight: 700,
                border: "none",
                cursor: submitting ? "default" : "pointer",
                fontSize: 15,
              }}
            >
              {submitting ? "Submitting…" : "Submit vote"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
