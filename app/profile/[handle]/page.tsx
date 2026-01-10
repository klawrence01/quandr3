"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GradientButton from "../../components/ui/GradientButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type TabKey = "open" | "resolved" | "about";

type MiniQuandr3 = {
  id: string;
  category: "Money" | "Style" | "Relationships";
  question: string;
  status: "Open" | "Resolved";
  timeLabel: string;
  votes: number;
  posterPick?: "A" | "B" | "C";
};

const MOCK_OPEN: MiniQuandr3[] = [
  {
    id: "rent-jumped-20",
    category: "Money",
    question:
      "Rent just jumped 20%. Do I split with a roommate, negotiate, or move?",
    status: "Open",
    timeLabel: "Closes in 1 day",
    votes: 142,
  },
  {
    id: "two-job-offers",
    category: "Money",
    question:
      "Two job offers, two cities. One pays more, one has better quality of life. Which way do I go?",
    status: "Open",
    timeLabel: "Closes in 3 hours",
    votes: 267,
  },
];

const MOCK_RESOLVED: MiniQuandr3[] = [
  {
    id: "bonus-5k",
    category: "Money",
    question: "I just got a $5,000 bonus. What’s the smartest move right now?",
    status: "Resolved",
    timeLabel: "Resolved · 2h ago",
    votes: 328,
    posterPick: "B",
  },
  {
    id: "left-on-read",
    category: "Relationships",
    question:
      "They left me on read after a vulnerable text. Reach out again or give space?",
    status: "Resolved",
    timeLabel: "Resolved · Yesterday",
    votes: 503,
    posterPick: "C",
  },
];

export default function ProfilePage() {
  const params = useParams<{ handle: string }>();
  const handle = (params?.handle || "curiosoken") as string;

  const displayName =
    handle.toLowerCase() === "curiosoken" ? "CuriosoKen" : handle;

  const [tab, setTab] = useState<TabKey>("open");

  // stub stats
  const stats = {
    accuracy: 72,
    quandr3sPosted: 9,
    followers: 34,
    following: 18,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        color: NAVY,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 18px 40px",
        }}
      >
        {/* Header row */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
            alignItems: "flex-start",
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#1e63f3 0%,#00a9a5 50%,#ff6b6b 100%)",
                boxShadow: "0 16px 40px rgba(11,35,67,0.30)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 24,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginBottom: 2,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(11,35,67,0.8)",
                  marginBottom: 6,
                }}
              >
                @{handle}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <LensChip label="Money-wise" />
                <LensChip label="No-fluff" />
                <LensChip label="Planner" tone="teal" />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "rgba(11,35,67,0.75)",
                maxWidth: 260,
                textAlign: "right",
              }}
            >
              This public profile shows how{" "}
              <span style={{ fontWeight: 700 }}>{displayName}</span> thinks
              through real decisions — open Quandr3s, resolved outcomes, and
              the lenses they use most.
            </div>
            <GradientButton
              onClick={() => {
                window.location.href = "/create";
              }}
            >
              Start your own Quandr3
            </GradientButton>
          </div>
        </header>

        {/* Stats + tabs */}
        <section
          style={{
            borderRadius: 24,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(120px,auto))",
                gap: 10,
              }}
            >
              <StatPill
                label="Quandr3s posted"
                value={stats.quandr3sPosted.toString()}
              />
              <StatPill
                label="Prediction accuracy"
                value={`${stats.accuracy}%`}
                highlight
              />
              <StatPill
                label="Followers"
                value={stats.followers.toString()}
              />
              <StatPill
                label="Following"
                value={stats.following.toString()}
              />
            </div>

            <button
              type="button"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(11,35,67,0.10)",
                background: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
              onClick={() =>
                alert(
                  "Stub: This will follow or unfollow this Curioso when real auth is wired."
                )
              }
            >
              Follow
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <TabButton
              active={tab === "open"}
              onClick={() => setTab("open")}
            >
              Open Quandr3s
            </TabButton>
            <TabButton
              active={tab === "resolved"}
              onClick={() => setTab("resolved")}
            >
              Resolved Quandr3s
            </TabButton>
            <TabButton
              active={tab === "about"}
              onClick={() => setTab("about")}
            >
              About this Curioso
            </TabButton>
          </div>
        </section>

        {/* Tab content */}
        {tab === "open" && (
          <TabPanel title="Open Quandr3s">
            {MOCK_OPEN.map((q) => (
              <MiniCard key={q.id} item={q} />
            ))}
            {MOCK_OPEN.length === 0 && (
              <EmptyNote text="No open Quandr3s right now. Check back later or follow to see new ones first." />
            )}
          </TabPanel>
        )}

        {tab === "resolved" && (
          <TabPanel title="Resolved Quandr3s">
            {MOCK_RESOLVED.map((q) => (
              <MiniCard key={q.id} item={q} />
            ))}
            {MOCK_RESOLVED.length === 0 && (
              <EmptyNote text="No resolved Quandr3s yet. Once this Curioso starts closing Quandr3s, they’ll show up here." />
            )}
          </TabPanel>
        )}

        {tab === "about" && (
          <TabPanel title="About this Curioso">
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(11,35,67,0.06)",
                background: "#ffffff",
                padding: 16,
                fontSize: 14,
                color: "rgba(11,35,67,0.88)",
                lineHeight: 1.6,
              }}
            >
              <p style={{ marginTop: 0 }}>
                This space will let Curiosos describe how they think and what
                they’re here for — money moves, life decisions, style help, or
                all of the above.
              </p>
              <p style={{ marginBottom: 0 }}>
                In V1, we’ll keep it simple: a short bio, a few lenses, and one
                pinned Quandr3 that shows their style of reasoning.
              </p>
            </div>
          </TabPanel>
        )}
      </div>
    </main>
  );
}

/* ---------- Small pieces ---------- */

function LensChip({
  label,
  tone = "navy",
}: {
  label: string;
  tone?: "navy" | "teal" | "coral";
}) {
  const color =
    tone === "teal" ? TEAL : tone === "coral" ? CORAL : NAVY;

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 750,
        border: "1px solid rgba(11,35,67,0.12)",
        background: "#ffffff",
        color,
      }}
    >
      {label}
    </span>
  );
}

function StatPill({
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
        padding: "8px 10px",
        borderRadius: 16,
        background: highlight ? "rgba(30,99,243,0.10)" : "#ffffff",
        border: highlight
          ? "1px solid rgba(30,99,243,0.45)"
          : "1px solid rgba(11,35,67,0.08)",
        boxShadow: highlight
          ? "0 12px 26px rgba(30,99,243,0.25)"
          : "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(11,35,67,0.75)",
          marginBottom: 2,
          fontWeight: 750,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(30,99,243,0.5)"
          : "1px solid rgba(11,35,67,0.10)",
        background: active ? "#ffffff" : "rgba(255,255,255,0.9)",
        color: active ? BLUE : "rgba(11,35,67,0.85)",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function TabPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 850,
          margin: "0 0 10px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function MiniCard({ item }: { item: MiniQuandr3 }) {
  const statusColor =
    item.status === "Open" ? TEAL : CORAL;
  const statusBg =
    item.status === "Open"
      ? "rgba(0,169,165,0.06)"
      : "rgba(255,107,107,0.06)";
  const statusBorder =
    item.status === "Open"
      ? "1px solid rgba(0,169,165,0.45)"
      : "1px solid rgba(255,107,107,0.45)";

  return (
    <Link
      href={`/q/${item.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <article
        style={{
          borderRadius: 18,
          border: "1px solid rgba(11,35,67,0.08)",
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 6,
          boxShadow: "0 10px 26px rgba(11,35,67,0.08)",
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
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: 11,
            }}
          >
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid rgba(11,35,67,0.10)",
                background: "#ffffff",
                fontWeight: 750,
              }}
            >
              {item.category}
            </span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                background: statusBg,
                border: statusBorder,
                color: statusColor,
                fontWeight: 750,
              }}
            >
              {item.status}
            </span>
            {item.posterPick && (
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,107,107,0.6)",
                  background: "rgba(255,107,107,0.08)",
                  color: CORAL,
                  fontWeight: 800,
                  fontSize: 10,
                }}
              >
                Curioso chose {item.posterPick}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 11,
              color: "rgba(11,35,67,0.8)",
            }}
          >
            {item.votes} votes · {item.timeLabel}
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.4,
          }}
        >
          {item.question}
        </div>
      </article>
    </Link>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px dashed rgba(11,35,67,0.16)",
        background: "#ffffff",
        padding: 14,
        fontSize: 13,
        color: "rgba(11,35,67,0.82)",
      }}
    >
      {text}
    </div>
  );
}
