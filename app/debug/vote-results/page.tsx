"use client";
// @ts-nocheck

import { useMemo } from "react";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// temp flags – later this comes from Supabase
const MOCK_USER_HAS_VOTED = true; // flip to false to see locked state
const MOCK_IS_RESOLVED = true; // this page is for resolved Quandr3s

type ChoiceResult = {
  id: string;
  label: string;
  votes: number;
  motives: string[]; // raw, anonymous text
};

type Quandr3Results = {
  id: string;
  question: string;
  totalVotes: number;
  closedAt: string;
  choices: ChoiceResult[];
  userChoiceId: string;
  userReason: string;
};

// --- MOCK DATA: Greece / Japan / Costa Rica example ---
const MOCK_RESULTS: Quandr3Results = {
  id: "travel-sponsored-1",
  question: "For a first big trip, should I choose Greece, Japan, or Costa Rica?",
  totalVotes: 908,
  closedAt: "Jan 17, 2026 • 1:00 AM",
  userChoiceId: "greece",
  userReason:
    "I picked Greece because I’ve always wanted to see the islands and mix history with beach time.",
  choices: [
    {
      id: "greece",
      label: "Greece",
      votes: 432,
      motives: [
        "Mix of history, beaches, and food.",
        "Feels romantic but also good for solo travel.",
        "Cheaper flights from my city right now.",
        "Feels like the best balance of culture and chill.",
        "I’ve wanted to see Santorini since I was a kid.",
        "I want European culture without feeling rushed the whole time.",
      ],
    },
    {
      id: "japan",
      label: "Japan",
      votes: 297,
      motives: [
        "Bucket-list culture and tech.",
        "Safe, clean, and easy to get around.",
        "Food alone makes it worth it.",
        "Anime, arcades, and temples in one trip.",
        "Feels like a once-in-a-lifetime cultural shock.",
      ],
    },
    {
      id: "costa-rica",
      label: "Costa Rica",
      votes: 179,
      motives: [
        "Nature, rainforests, and beaches all in one.",
        "Shorter flight, less jet lag.",
        "More affordable once you land.",
        "I’m big on eco-tourism and wildlife.",
        "I want something chill and outdoorsy, not a city trip.",
      ],
    },
  ],
};

export default function VoteResultsPage() {
  const data = MOCK_RESULTS;

  const { sortedChoices, winningChoice, winningPct } = useMemo(() => {
    const sorted = [...data.choices].sort((a, b) => b.votes - a.votes);
    const total = Math.max(data.totalVotes, 1);
    const winner = sorted[0];
    const winningPercent = Math.round((winner.votes / total) * 100);

    return {
      sortedChoices: sorted,
      winningChoice: winner,
      winningPct: winningPercent,
    };
  }, [data]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: SOFT_BG,
        color: NAVY,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <section style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "#6b7a93",
              marginBottom: 6,
            }}
          >
            Quandr3 results
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: -0.3,
              color: NAVY,
            }}
          >
            Here’s how this Quandr3 turned out.
          </h1>
          <p
            style={{
              margin: 0,
              marginTop: 8,
              fontSize: 14,
              color: "#555",
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            You made your choice and shared your reason. Now see the full
            breakdown: how everyone voted, and the raw motives behind each
            option — A, B, C, and D.
          </p>
        </section>

        {/* Question + Your choice */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.3fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 22,
              padding: "16px 18px 18px",
              background: "#ffffff",
              boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
              border: "1px solid rgba(11,35,67,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "#6b7a93",
                marginBottom: 4,
              }}
            >
              Quandr3
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 820,
                color: NAVY,
                lineHeight: 1.4,
              }}
            >
              {data.question}
            </h2>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#6b7a93",
              }}
            >
              <span style={{ fontWeight: 600 }}>{data.totalVotes}</span> total
              votes · Closed {data.closedAt}
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: "14px 16px 14px",
              background: "linear-gradient(135deg, #ffffff, #e8f4ff)",
              boxShadow: "0 12px 30px rgba(11,35,67,0.14)",
              border: "1px solid rgba(30,99,243,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "#39507b",
                marginBottom: 4,
              }}
            >
              Your choice
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 750,
                color: NAVY,
                marginBottom: 4,
              }}
            >
              You chose:{" "}
              <span style={{ color: BLUE }}>
                {data.choices.find((c) => c.id === data.userChoiceId)?.label ||
                  "—"}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#4b5670",
                marginBottom: 8,
              }}
            >
              {data.userReason}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#4b5670",
                marginTop: 6,
              }}
            >
              {winningChoice.id === data.userChoiceId ? (
                <>
                  You’re with the{" "}
                  <strong style={{ color: TEAL }}>winning group</strong>.{" "}
                  <strong>{winningPct}%</strong> of people chose the same path.
                </>
              ) : (
                <>
                  You’re in the{" "}
                  <strong style={{ color: CORAL }}>minority</strong> on this
                  one. <strong>{winningPct}%</strong> went with{" "}
                  <strong>{winningChoice.label}</strong>.
                </>
              )}
            </div>
          </div>
        </section>

        {/* Percentages with A/B/C/D */}
        <section
          style={{
            borderRadius: 22,
            padding: "16px 18px 14px",
            background: "#ffffff",
            boxShadow: "0 10px 26px rgba(0,0,0,0.04)",
            border: "1px solid rgba(11,35,67,0.08)",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              How everyone voted (A / B / C / D)
            </h3>
            <div
              style={{
                fontSize: 11,
                color: "#6b7a93",
              }}
            >
              Each bar shows the percentage of total votes for that option.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedChoices.map((choice, index) => {
              const pct = Math.round(
                (choice.votes / Math.max(data.totalVotes, 1)) * 100
              );
              const isWinner = choice.id === winningChoice.id;
              const isUserChoice = choice.id === data.userChoiceId;
              const letter = LETTERS[index] || "?";

              return (
                <div key={choice.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 13,
                      marginBottom: 3,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 650,
                        color: isWinner ? NAVY : "#36405a",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          border: "1px solid rgba(11,35,67,0.18)",
                          background: "#f5f7ff",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: "#394867",
                        }}
                      >
                        {letter}
                      </span>
                      <span>{choice.label}</span>
                      {isWinner && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            marginLeft: 4,
                            fontSize: 11,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background: "rgba(0,169,165,0.08)",
                            color: TEAL,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                          }}
                        >
                          <span>🏆</span>
                          <span>Top choice</span>
                        </span>
                      )}
                      {isUserChoice && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: "rgba(30,99,243,0.08)",
                            color: BLUE,
                            fontWeight: 700,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7a93",
                      }}
                    >
                      <strong>{pct}%</strong> · {choice.votes} votes
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 12,
                      borderRadius: 999,
                      background: "#eef2ff",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: isWinner
                          ? `linear-gradient(90deg, ${BLUE}, ${TEAL})`
                          : "rgba(30,99,243,0.55)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Motives by option – raw, scrollable with A/B/C/D */}
        <section style={{ marginBottom: 26 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              Raw motives by choice (A / B / C / D)
            </h3>
            <div
              style={{
                fontSize: 11,
                color: "#6b7a93",
              }}
            >
              Anonymous, word-for-word responses from voters on each option.
              Scroll inside each block to see more.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {sortedChoices.map((choice, index) => {
              const isWinner = choice.id === winningChoice.id;
              const letter = LETTERS[index] || "?";

              return (
                <article
                  key={choice.id}
                  style={{
                    borderRadius: 20,
                    padding: "14px 16px 14px",
                    background: "#ffffff",
                    boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
                    border: isWinner
                      ? "1px solid rgba(0,169,165,0.25)"
                      : "1px solid rgba(11,35,67,0.12)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: "1px solid rgba(11,35,67,0.18)",
                        background: "#f5f7ff",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "#394867",
                      }}
                    >
                      {letter}
                    </span>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        fontWeight: 800,
                        color: isWinner ? TEAL : "#6b7a93",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {isWinner && <span>🏆</span>}
                      <span>
                        {isWinner ? "Top choice motives" : "Motives for this option"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 750,
                      color: NAVY,
                      marginBottom: 4,
                    }}
                  >
                    {choice.label}{" "}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#6b7a93",
                      }}
                    >
                      · {choice.votes} votes
                    </span>
                  </div>

                  {choice.motives.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#777",
                        marginTop: 4,
                      }}
                    >
                      No motives recorded yet for this option.
                    </div>
                  ) : (
                    <ul
                      style={{
                        margin: 0,
                        marginTop: 6,
                        paddingLeft: 18,
                        fontSize: 12,
                        color: "#333",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxHeight: 150,
                        overflowY: "auto",
                        paddingRight: 4,
                      }}
                    >
                      {choice.motives
                        .slice()
                        .reverse()
                        .map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Private discussion room */}
        <section
          style={{
            borderRadius: 22,
            padding: "16px 18px 16px",
            background: "#ffffff",
            boxShadow: "0 10px 28px rgba(0,0,0,0.04)",
            border: "1px solid rgba(11,35,67,0.12)",
            marginTop: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: "#6b7a93",
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                Private discussion room
              </div>

              {MOCK_IS_RESOLVED ? (
                MOCK_USER_HAS_VOTED ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#404b63",
                      lineHeight: 1.55,
                    }}
                  >
                    This Quandr3 is resolved. Our <strong>Curioso</strong> has
                    chosen <strong>{winningChoice.label}</strong>, and a private
                    debrief room is now open for everyone who{" "}
                    <strong>participated in this Quandr3</strong>.
                    <br />
                    <br />
                    The room will stay open for{" "}
                    <strong>72 hours</strong> for real discussion, follow-ups,
                    and next-step thinking. After that, it switches to{" "}
                    <strong>read-only mode</strong> so the full decision record
                    and motives are preserved.
                  </p>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#404b63",
                      lineHeight: 1.55,
                    }}
                  >
                    This Quandr3 is resolved. Our <strong>Curioso</strong> has
                    made a call, and a private discussion room is now live.
                    <br />
                    <br />
                    Only those who <strong>voted</strong> on this Quandr3 can
                    enter. The room will remain open for{" "}
                    <strong>72 hours</strong> before switching to{" "}
                    <strong>read-only mode</strong> so the full decision and
                    motives can be referenced later.
                  </p>
                )
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#404b63",
                    lineHeight: 1.55,
                  }}
                >
                  Once this Quandr3 is resolved and the{" "}
                  <strong>Curioso locks in a choice</strong>, a{" "}
                  <strong>private 72-hour discussion room</strong> will unlock
                  for everyone who participated. After that, the room becomes{" "}
                  <strong>read-only</strong> so the full decision and motives
                  are archived.
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              {/* simple static timeframe badge for now */}
              {MOCK_IS_RESOLVED && (
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(11,35,67,0.16)",
                    background: "#f5f7ff",
                    fontSize: 11,
                    color: "#4b5670",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>⏱</span>
                  <span>Room open for 72 hours after resolution</span>
                </div>
              )}

              {MOCK_IS_RESOLVED && MOCK_USER_HAS_VOTED ? (
                <>
                  <button
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "none",
                      background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Enter discussion room
                  </button>
                  <button
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(11,35,67,0.2)",
                      background: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Explore more Quandr3s
                  </button>
                </>
              ) : MOCK_IS_RESOLVED ? (
                <>
                  <button
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "1px dashed rgba(11,35,67,0.4)",
                      background: "#f7f8ff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "not-allowed",
                      color: "#7b849b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Discussion room locked
                  </button>
                  <button
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(11,35,67,0.2)",
                      background: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Explore more Quandr3s
                  </button>
                </>
              ) : (
                <button
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(11,35,67,0.2)",
                    background: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  Waiting for resolution…
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
