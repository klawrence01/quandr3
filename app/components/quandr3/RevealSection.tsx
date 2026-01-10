"use client";

import React from "react";
import Link from "next/link";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

export type ChoiceResult = {
  key: "A" | "B" | "C" | "D";
  label: string; // e.g. "Look A"
  description?: string;
  percent: number;
  isWinner: boolean;
};

export type ReasoningEntry = {
  id: string;
  handle: string; // "@kenlawrence"
  displayName: string; // "Ken"
  lenses: string[]; // ["Money-wise", "No-fluff"]
  text: string;
};

type RevealSectionProps = {
  question: string;
  context?: string;
  totalVotes: number;
  durationLabel: string; // "24h window" or "Closed after 2h"
  closedAgoLabel: string; // "Closed 2h ago"
  winningChoice: ChoiceResult;
  allChoices: ChoiceResult[];
  posterChoiceKey?: "A" | "B" | "C" | "D";
  reasoning: ReasoningEntry[];
  curiosoHandle: string; // for follow CTA
};

export function RevealSection({
  question,
  context,
  totalVotes,
  durationLabel,
  closedAgoLabel,
  winningChoice,
  allChoices,
  posterChoiceKey,
  reasoning,
  curiosoHandle,
}: RevealSectionProps) {
  const posterMatched =
    posterChoiceKey && posterChoiceKey === winningChoice.key;

  return (
    <section
      style={{
        borderRadius: 24,
        background: "#ffffff",
        padding: 20,
        boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
        border: "1px solid rgba(11,35,67,0.06)",
        display: "grid",
        gap: 18,
      }}
    >
      {/* Top: hero outcome card + stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)",
          gap: 16,
        }}
      >
        {/* Hero outcome */}
        <div
          style={{
            borderRadius: 20,
            background: SOFT_BG,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(11,35,67,0.75)",
            }}
          >
            Quandr3 Resolved
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1.4,
              color: NAVY,
            }}
          >
            {question}
          </div>
          {context && (
            <div
              style={{
                fontSize: 13,
                color: "rgba(11,35,67,0.82)",
              }}
            >
              {context}
            </div>
          )}

          {/* Winner visual */}
          <div
            style={{
              marginTop: 6,
              borderRadius: 18,
              background: "#ffffff",
              padding: 14,
              display: "grid",
              gridTemplateColumns: "96px minmax(0,1fr)",
              gap: 12,
              alignItems: "center",
              boxShadow: "0 14px 32px rgba(11,35,67,0.10)",
              border: "1px solid rgba(11,35,67,0.08)",
            }}
          >
            <div
              style={{
                height: 80,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg,#1e63f3 0%,#00a9a5 45%,#ff6b6b 100%)",
              }}
            />
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: BLUE,
                }}
              >
                Winning Choice · {winningChoice.key}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 850,
                  color: NAVY,
                }}
              >
                {winningChoice.label}
              </div>
              {winningChoice.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(11,35,67,0.8)",
                  }}
                >
                  {winningChoice.description}
                </div>
              )}
              {posterChoiceKey && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 750,
                    padding: "4px 8px",
                    borderRadius: 999,
                    alignSelf: "flex-start",
                    background: posterMatched
                      ? "rgba(0,169,165,0.08)"
                      : "rgba(255,107,107,0.06)",
                    color: posterMatched ? TEAL : CORAL,
                    border: posterMatched
                      ? "1px solid rgba(0,169,165,0.6)"
                      : "1px solid rgba(255,107,107,0.6)",
                  }}
                >
                  {posterMatched
                    ? "Curioso chose the winning option"
                    : `Curioso chose ${posterChoiceKey}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats column */}
        <div
          style={{
            padding: 14,
            borderRadius: 20,
            border: "1px solid rgba(11,35,67,0.06)",
            background: "#ffffff",
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(11,35,67,0.75)",
            }}
          >
            Outcome Summary
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 10,
            }}
          >
            <SmallStat label="Total votes" value={totalVotes.toString()} />
            <SmallStat label="Voting window" value={durationLabel} />
            <SmallStat label="Closed" value={closedAgoLabel} />
            <SmallStat
              label="Winning margin"
              value={`${winningChoice.percent.toFixed(0)}%`}
              highlight
            />
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "rgba(11,35,67,0.78)",
              lineHeight: 1.5,
            }}
          >
            This Quandr3 is closed. You can still learn from how people voted
            and why — but you can&apos;t change the outcome.
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <ChoiceBreakdown allChoices={allChoices} />

      {/* Reasoning + share / follow */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.4fr) minmax(0,0.9fr)",
          gap: 16,
        }}
      >
        <ReasoningList reasoning={reasoning} />

        <div
          style={{
            display: "grid",
            gap: 12,
            alignContent: "flex-start",
          }}
        >
          <PosterReflectionStub />
          <ShareAndFollow curiosoHandle={curiosoHandle} />
          <ShareCardPreview
            question={question}
            winningChoice={winningChoice}
            totalVotes={totalVotes}
          />
        </div>
      </div>
    </section>
  );
}

/* ------- Small pieces ------- */

function SmallStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "8px 10px",
        background: highlight ? "rgba(30,99,243,0.08)" : SOFT_BG,
        border: highlight
          ? "1px solid rgba(30,99,243,0.5)"
          : "1px solid rgba(11,35,67,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(11,35,67,0.8)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: NAVY,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ChoiceBreakdown({ allChoices }: { allChoices: ChoiceResult[] }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(11,35,67,0.06)",
        background: "#ffffff",
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: NAVY,
          marginBottom: 4,
        }}
      >
        How people voted
      </div>
      {allChoices.map((choice) => {
        const barColor = choice.isWinner ? BLUE : "rgba(30,99,243,0.25)";
        return (
          <div key={choice.key} style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "rgba(11,35,67,0.85)",
              }}
            >
              <div>
                <span
                  style={{
                    fontWeight: 900,
                    marginRight: 6,
                  }}
                >
                  {choice.key}.
                </span>
                <span>{choice.label}</span>
              </div>
              <div
                style={{
                  fontWeight: 800,
                }}
              >
                {choice.percent.toFixed(0)}%
              </div>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: SOFT_BG,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(choice.percent, 5)}%`,
                  borderRadius: 999,
                  background: barColor,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReasoningList({ reasoning }: { reasoning: ReasoningEntry[] }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(11,35,67,0.06)",
        background: "#ffffff",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: NAVY,
        }}
      >
        Why people chose what they chose
      </div>

      {reasoning.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(11,35,67,0.82)",
          }}
        >
          In future versions, you&apos;ll see top perspectives here — short,
          focused reasoning from people with lenses you care about.
        </div>
      )}

      {reasoning.map((r) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "32px minmax(0,1fr)",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,#1e63f3 0%,#00a9a5 50%,#ff6b6b 100%)",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            {r.displayName.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(11,35,67,0.9)",
              display: "grid",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontWeight: 750,
                }}
              >
                {r.displayName}{" "}
                <span
                  style={{
                    fontWeight: 500,
                    color: "rgba(11,35,67,0.75)",
                    marginLeft: 4,
                  }}
                >
                  {r.handle}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  justifyContent: "flex-end",
                }}
              >
                {r.lenses.map((lens) => (
                  <span
                    key={lens}
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      border: "1px solid rgba(11,35,67,0.10)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: NAVY,
                      background: SOFT_BG,
                    }}
                  >
                    {lens}
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(11,35,67,0.9)",
              }}
            >
              {r.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PosterReflectionStub() {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px dashed rgba(11,35,67,0.18)",
        background: "#ffffff",
        padding: 12,
        fontSize: 12,
        color: "rgba(11,35,67,0.88)",
      }}
    >
      <strong>Poster reflection (V2):</strong> In the live app, the Curioso can
      add a short note like “Why I chose B” so followers can see how they
      processed the results.
    </div>
  );
}

function ShareAndFollow({ curiosoHandle }: { curiosoHandle: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(11,35,67,0.08)",
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: NAVY,
        }}
      >
        Keep the story going
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <button
          type="button"
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: BLUE,
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Ask a Quandr3
        </button>
        <button
          type="button"
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(11,35,67,0.16)",
            background: "#ffffff",
            color: NAVY,
            fontSize: 11,
            fontWeight: 750,
            cursor: "pointer",
          }}
        >
          Share results
        </button>
        <Link
          href={`/profile/${curiosoHandle}`}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(11,35,67,0.16)",
            background: "#ffffff",
            color: NAVY,
            fontSize: 11,
            fontWeight: 750,
            textDecoration: "none",
          }}
        >
          Follow this Curioso
        </Link>
      </div>
    </div>
  );
}

/* ------- Share card preview (for future export) ------- */

function ShareCardPreview({
  question,
  winningChoice,
  totalVotes,
}: {
  question: string;
  winningChoice: ChoiceResult;
  totalVotes: number;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background:
          "linear-gradient(145deg,#0b2343 0%,#1e63f3 45%,#00a9a5 100%)",
        padding: 12,
        color: "#ffffff",
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: 0.9,
        }}
      >
        Quandr3 · Resolved
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 850,
          lineHeight: 1.4,
        }}
      >
        {question}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 11,
        }}
      >
        Winning choice:{" "}
        <span
          style={{
            fontWeight: 900,
          }}
        >
          {winningChoice.key}. {winningChoice.label}
        </span>{" "}
        ({winningChoice.percent.toFixed(0)}%)
      </div>
      <div
        style={{
          fontSize: 10,
          opacity: 0.9,
        }}
      >
        {totalVotes} people weighed in. Ask. Share. Decide. #Quandr3
      </div>
    </div>
  );
}
