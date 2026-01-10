"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import OptionBlock from "./OptionBlock";

export type Quandr3Mock = {
  id: string;
  poster: {
    name: string;
    avatar?: string;
  };
  category: "Money" | "Style" | "Relationships";
  title: string;
  context: string;
  location: string;
  time: string;
  media: "video" | "images";
  layout: "grid4" | "list";
  choices: [string, string, string, string];
  votes: number;
  status: "Open" | "Resolved";
};

const voteKey = (id: string) => `quandr3_vote_${id}`;
const resolveKey = (id: string) => `quandr3_resolve_${id}`;

function Tag({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.2,
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.10)",
      }}
    >
      {text}
    </span>
  );
}

function FollowButton() {
  return (
    <button
      type="button"
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.18)",
        background: "white",
        color: "#0b1020",
        fontSize: 12,
        fontWeight: 950,
        cursor: "pointer",
      }}
      aria-label="Follow curioso (coming soon)"
      title="Follow (coming soon)"
    >
      + Follow
    </button>
  );
}

function PosterHeader({ name }: { name: string }) {
  const safeName = name?.trim() ? name : "Anonymous";
  const initial = (safeName.charAt(0) || "?").toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(0,150,255,0.20), rgba(0,0,0,0.04))",
          border: "1px solid rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 980,
          color: "#0b1020",
        }}
        aria-label={`Curioso avatar: ${safeName}`}
        title={safeName}
      >
        {initial}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <div
            style={{
              fontWeight: 950,
              fontSize: 14,
              color: "#0b1020",
            }}
          >
            {safeName}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Curioso</div>
        </div>
        <FollowButton />
      </div>
    </div>
  );
}

function MediaHeader({ kind }: { kind: "video" | "images" }) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 22,
        border: "1px solid rgba(0,0,0,0.10)",
        background:
          "radial-gradient(1200px 400px at 20% 0%, rgba(0,150,255,0.12), rgba(255,255,255,0.65)), linear-gradient(135deg, rgba(255,255,255,0.55), rgba(0,0,0,0.02))",
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        color: "#0b1020",
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 16, opacity: 0.9 }}>
        {kind === "video" ? "7s VIDEO (Preview)" : "IMAGE SET (Preview)"}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          right: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <span style={{ fontWeight: 900 }}>Tap to view</span>
        <span style={{ opacity: 0.7 }}>Percent hidden until vote ✅</span>
      </div>
    </div>
  );
}

// NEW: vertical stack using OptionBlock
function OptionsColumn({
  choices,
  votedIndex,
  onVote,
}: {
  choices: Quandr3Mock["choices"];
  votedIndex: number | null;
  onVote: (idx: number) => void;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {choices.map((choice, index) => {
        const label = String.fromCharCode(65 + index); // A, B, C, D
        const selected = votedIndex === index;
        return (
          <OptionBlock
            key={`${label}-${choice}`}
            label={label}
            text={choice}
            selected={selected}
            helperText={
              selected ? "Your vote ✅" : "Vote to reveal distribution"
            }
            onSelect={() => onVote(index)}
          />
        );
      })}
    </div>
  );
}

export default function Quandr3Card({ q }: { q: Quandr3Mock }) {
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [resolvedIndex, setResolvedIndex] = useState<number | null>(null);

  const resolvedChoiceText = useMemo(() => {
    if (resolvedIndex === null) return null;
    return q.choices[resolvedIndex] ?? null;
  }, [resolvedIndex, q.choices]);

  useEffect(() => {
    try {
      const rawVote = window.localStorage.getItem(voteKey(q.id));
      if (rawVote) {
        const parsed = JSON.parse(rawVote) as { index: number };
        if (typeof parsed?.index === "number") setVotedIndex(parsed.index);
      }

      const rawRes = window.localStorage.getItem(resolveKey(q.id));
      if (rawRes) {
        const parsed = JSON.parse(rawRes) as { index: number };
        if (typeof parsed?.index === "number") setResolvedIndex(parsed.index);
      }
    } catch {
      // ignore
    }
  }, [q.id]);

  function onVote(idx: number) {
    setVotedIndex(idx);
    try {
      window.localStorage.setItem(
        voteKey(q.id),
        JSON.stringify({ index: idx, ts: Date.now() })
      );
    } catch {
      // ignore
    }
  }

  const match =
    votedIndex !== null && resolvedIndex !== null
      ? votedIndex === resolvedIndex
      : null;

  return (
    <article
      style={{
        borderRadius: 26,
        padding: 18,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "white",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
      }}
    >
      {/* Curioso + Meta row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <PosterHeader name={q.poster?.name ?? "Anonymous"} />

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Tag text={q.category} />
          <Tag text={q.location} />
          <span style={{ fontSize: 12, opacity: 0.75 }}>{q.time}</span>
          <span
            style={{ fontSize: 12, fontWeight: 950, opacity: 0.85 }}
          >
            {resolvedIndex !== null ? "Resolved" : q.status}
          </span>
        </div>
      </div>

      <h2
        style={{
          marginTop: 12,
          fontSize: 22,
          fontWeight: 980,
          lineHeight: 1.15,
          color: "#0b1020",
        }}
      >
        {q.title}
      </h2>

      <p
        style={{
          marginTop: 8,
          opacity: 0.85,
          fontSize: 14,
          lineHeight: 1.4,
          color: "#0b1020",
        }}
      >
        {q.context}
      </p>

      <MediaHeader kind={q.media} />

      {/* Voting UI – vertical stack */}
      <OptionsColumn
        choices={q.choices}
        votedIndex={votedIndex}
        onVote={onVote}
      />

      {/* Resolution + points (read-only) */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 14,
          border: "1px solid rgba(0,0,0,0.10)",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        {resolvedIndex === null ? (
          <>
            <div style={{ fontWeight: 980, color: "#0b1020" }}>
              Resolution
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                opacity: 0.78,
                lineHeight: 1.4,
              }}
            >
              Not resolved yet. After the curioso chooses the final answer,
              match bonuses can be awarded.
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 980, color: "#0b1020" }}
                >
                  Curioso picked
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: 950,
                    color: "#0b1020",
                  }}
                >
                  {String.fromCharCode(65 + resolvedIndex)} —{" "}
                  {resolvedChoiceText}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                {match === null ? (
                  <div style={{ fontSize: 13, opacity: 0.78 }}>
                    Vote to see if you matched.
                  </div>
                ) : match ? (
                  <div
                    style={{
                      fontWeight: 980,
                      color: "#0b1020",
                    }}
                  >
                    ✅ Match bonus: +35
                  </div>
                ) : (
                  <div
                    style={{
                      fontWeight: 980,
                      color: "#0b1020",
                    }}
                  >
                    No match (this time)
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginTop: 4,
                  }}
                >
                  Full scoring rules coming soon
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 16,
          fontSize: 13,
          opacity: 0.9,
        }}
      >
        <span
          style={{ fontWeight: 950, color: "#0b1020" }}
        >
          {q.votes.toLocaleString()} votes
        </span>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href={`/q/${q.id}`}
            style={{
              fontWeight: 950,
              textDecoration: "underline",
              color: "#0b1020",
            }}
          >
            Open Quandr3 →
          </Link>
          <span style={{ opacity: 0.4 }}>|</span>
          <Link
            href={`/q/${q.id}/resolve`}
            style={{
              fontWeight: 950,
              textDecoration: "underline",
              color: "#0b1020",
            }}
          >
            Resolve (Curioso) →
          </Link>
        </div>
      </div>
    </article>
  );
}
