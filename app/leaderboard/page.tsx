"use client";

import React from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type LeaderEntry = {
  id: string;
  name: string;
  username: string;
  avatarInitials: string;
  accuracy: number; // 0–100
  played: number;
  rank: number;
  isYou?: boolean;
};

const mockLeaderboard: LeaderEntry[] = [
  {
    id: "u1",
    name: "Maya Johnson",
    username: "Maya",
    avatarInitials: "MJ",
    accuracy: 82,
    played: 147,
    rank: 1,
  },
  {
    id: "u2",
    name: "Derrick Cole",
    username: "Derrick",
    avatarInitials: "DC",
    accuracy: 79,
    played: 203,
    rank: 2,
  },
  {
    id: "u3",
    name: "Nia Rivers",
    username: "Nia",
    avatarInitials: "NR",
    accuracy: 77,
    played: 98,
    rank: 3,
  },
  {
    id: "u4",
    name: "Omar Watts",
    username: "Omar",
    avatarInitials: "OW",
    accuracy: 74,
    played: 121,
    rank: 4,
  },
  {
    id: "u5",
    name: "Tasha Green",
    username: "Tasha",
    avatarInitials: "TG",
    accuracy: 73,
    played: 89,
    rank: 5,
  },
  {
    id: "u-you",
    name: "Ken Lawrence",
    username: "Ken",
    avatarInitials: "KL",
    accuracy: 63,
    played: 41,
    rank: 18,
    isYou: true,
  },
];

export default function LeaderboardPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        color: NAVY,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 18px" }}>
        {/* Header row */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: 28,
                fontWeight: 950,
              }}
            >
              Leaderboard
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(11,35,67,0.78)",
              }}
            >
              Top predictors and sharpest thinkers on Quandr3.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(11,35,67,0.16)",
              background: "#ffffff",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            Back to dashboard
          </button>
        </header>

        {/* Filters row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: 6,
              padding: 4,
              borderRadius: 999,
              background: "#ffffff",
              boxShadow: "0 10px 26px rgba(11,35,67,0.08)",
            }}
          >
            <FilterPill label="Global" active />
            <FilterPill label="Categories" />
            <FilterPill label="Local" />
            <FilterPill label="Following" />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(11,35,67,0.16)",
              background: "#ffffff",
              fontSize: 12,
            }}
          >
            <span style={{ opacity: 0.8 }}>Sort</span>
            <span
              style={{
                fontWeight: 750,
                color: BLUE,
              }}
            >
              Accuracy ▼
            </span>
          </div>
        </div>

        {/* Table card */}
        <section
          style={{
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 18,
          }}
        >
          {/* Header line */}
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "rgba(11,35,67,0.7)",
              padding: "4px 6px 8px",
            }}
          >
            <div style={{ width: 40 }}>Rank</div>
            <div style={{ flex: 1 }}>Curioso</div>
            <div style={{ width: 120, textAlign: "right" }}>Accuracy</div>
            <div style={{ width: 120, textAlign: "right" }}>Played</div>
          </div>

          <div
            style={{
              height: 1,
              background: "rgba(11,35,67,0.08)",
              marginBottom: 4,
            }}
          />

          <div
            style={{
              maxHeight: 420,
              overflowY: "auto",
              paddingRight: 4,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {mockLeaderboard.map((entry) => (
              <LeaderRow key={entry.id} entry={entry} />
            ))}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              color: "rgba(11,35,67,0.7)",
            }}
          >
            <span>V1: leaderboard uses local mock data.</span>
            <button
              type="button"
              onClick={() => router.push("/stats")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 750,
                color: BLUE,
              }}
            >
              View my stats →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function FilterPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      style={{
        borderRadius: 999,
        border: "none",
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 750,
        cursor: "pointer",
        background: active ? BLUE : "transparent",
        color: active ? "#ffffff" : "rgba(11,35,67,0.8)",
      }}
    >
      {label}
    </button>
  );
}

function LeaderRow({ entry }: { entry: LeaderEntry }) {
  const crown =
    entry.rank === 1 ? (
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: CORAL,
          marginLeft: 4,
        }}
      >
        ★
      </span>
    ) : null;

  const bg = entry.isYou
    ? "rgba(0,169,165,0.08)"
    : "rgba(11,35,67,0.01)";
  const border = entry.isYou
    ? `1px solid rgba(0,169,165,0.6)`
    : "1px solid rgba(11,35,67,0.08)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: 16,
        background: bg,
        border,
        cursor: "pointer",
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
    >
      <div
        style={{
          width: 40,
          fontSize: 13,
          fontWeight: 800,
          color: "rgba(11,35,67,0.9)",
        }}
      >
        #{entry.rank}
      </div>

      {/* Avatar + name */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background:
              entry.rank === 1
                ? `linear-gradient(135deg, ${BLUE}, ${CORAL})`
                : `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          {entry.avatarInitials}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
            }}
          >
            {entry.username}
            {crown}
            {entry.isYou && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(0,169,165,0.12)",
                  color: TEAL,
                }}
              >
                You
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(11,35,67,0.7)",
            }}
          >
            {entry.name}
          </div>
        </div>
      </div>

      {/* Accuracy */}
      <div
        style={{
          width: 120,
          textAlign: "right",
          fontSize: 13,
          fontWeight: 850,
          color: BLUE,
        }}
      >
        {entry.accuracy}%
      </div>

      {/* Played */}
      <div
        style={{
          width: 120,
          textAlign: "right",
          fontSize: 12,
          color: "rgba(11,35,67,0.78)",
        }}
      >
        {entry.played} played
      </div>
    </div>
  );
}
