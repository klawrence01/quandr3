"use client";

import React, { useState } from "react";
import Link from "next/link";
import GradientButton from "../components/ui/GradientButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type Category = "Money" | "Style" | "Relationships";
type Status = "Open" | "Resolved";

type FeedItem = {
  id: string;
  category: Category;
  status: Status;
  question: string;
  curiosoName: string;
  curiosoHandle: string;
  relationshipTag: "Following" | "Lens match" | "Trending" | "New";
  lenses: string[];
  totalVotes: number;
  timeLabel: string;
  curiosoChoice?: "A" | "B" | "C" | "D";
  snippet: string;
};

const MOCK_FEED: FeedItem[] = [
  {
    id: "bonus-5k",
    category: "Money",
    status: "Resolved",
    question: "I just got a $5,000 bonus. What’s the smartest move right now?",
    curiosoName: "CuriosoKen",
    curiosoHandle: "curiosoken",
    relationshipTag: "Lens match",
    lenses: ["Money-wise", "No-fluff"],
    totalVotes: 328,
    timeLabel: "Resolved · 2h ago",
    curiosoChoice: "B",
    snippet: "Most voters invested for long-term growth. Curioso chose B.",
  },
  {
    id: "outfit-wedding",
    category: "Style",
    status: "Open",
    question:
      "Friend’s evening wedding, semi-formal. Which look makes the best impression?",
    curiosoName: "StyledByJay",
    curiosoHandle: "styledbyjay",
    relationshipTag: "Following",
    lenses: ["Trendy", "Keep it fun"],
    totalVotes: 91,
    timeLabel: "Closes in 6 hours",
    snippet: "Image B is slightly ahead, but C is gaining.",
  },
  {
    id: "split-rent-or-move",
    category: "Money",
    status: "Open",
    question:
      "Rent just jumped 20%. Do I split with a roommate, negotiate, or move?",
    curiosoName: "NumbersNerd",
    curiosoHandle: "numbersnerd",
    relationshipTag: "Trending",
    lenses: ["Planner"],
    totalVotes: 142,
    timeLabel: "Closes in 1 day",
    snippet: "Most votes lean toward negotiating first.",
  },
  {
    id: "text-back-or-space",
    category: "Relationships",
    status: "Resolved",
    question:
      "They left me on read after a vulnerable text. Do I reach out again or give space?",
    curiosoName: "HeartCheck",
    curiosoHandle: "heartcheck",
    relationshipTag: "Lens match",
    lenses: ["Empathy first"],
    totalVotes: 503,
    timeLabel: "Resolved · 5h ago",
    curiosoChoice: "C",
    snippet: "Curioso chose C: give space now, then check in once.",
  },
  {
    id: "job-offer-two-cities",
    category: "Money",
    status: "Resolved",
    question:
      "Two job offers, two cities. One pays more, one has better quality of life. Which way do I go?",
    curiosoName: "CareerCrossroads",
    curiosoHandle: "careercrossroads",
    relationshipTag: "New",
    lenses: ["Big-picture thinker"],
    totalVotes: 267,
    timeLabel: "Resolved · Yesterday",
    curiosoChoice: "A",
    snippet: "Community tilted toward quality of life over salary.",
  },
];

export default function HomeFeedPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");

  const filtered = MOCK_FEED.filter((item) => {
    const statusOK = statusFilter === "All" || item.status === statusFilter;
    const catOK =
      categoryFilter === "All" || item.category === categoryFilter;
    return statusOK && catOK;
  });

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
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              Your feed
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "rgba(11,35,67,0.8)",
                maxWidth: 520,
              }}
            >
              A mix of Quandr3s from people you follow, lenses you picked, and
              what’s trending right now. Vote, read the reasoning, and follow
              the thinkers you want to hear from again.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "rgba(11,35,67,0.72)",
                maxWidth: 260,
                textAlign: "right",
              }}
            >
              Lenses are active. We’ll quietly prioritize{" "}
              <strong>Money-wise</strong> and{" "}
              <strong>Keep it light</strong> voices for you.
            </div>
            <GradientButton
              onClick={() => {
                // later: send to create flow
                window.location.href = "/create";
              }}
            >
              Ask a new Quandr3
            </GradientButton>
          </div>
        </header>

        {/* Filters */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {/* Status filter */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 750,
                opacity: 0.85,
              }}
            >
              Status
            </span>
            {[
              { label: "All", value: "All" },
              { label: "Open", value: "Open" },
              { label: "Resolved", value: "Resolved" },
            ].map((s) => {
              const isActive = statusFilter === s.value;
              const color =
                s.value === "Open" ? TEAL : s.value === "Resolved" ? CORAL : NAVY;

              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value as Status | "All")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: isActive
                      ? `1px solid ${color}`
                      : "1px solid rgba(11,35,67,0.12)",
                    background: isActive
                      ? "rgba(11,35,67,0.02)"
                      : "#ffffff",
                    color: isActive ? color : NAVY,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Category filter */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 750,
                opacity: 0.85,
              }}
            >
              Categories
            </span>
            {["All", "Money", "Style", "Relationships"].map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(cat as Category | "All")
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: isActive
                      ? `1px solid ${BLUE}`
                      : "1px solid rgba(11,35,67,0.12)",
                    background: isActive ? "rgba(30,99,243,0.08)" : "#ffffff",
                    color: isActive ? BLUE : NAVY,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Feed list */}
        <section
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/q/${item.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article
                style={{
                  borderRadius: 24,
                  background: "#ffffff",
                  boxShadow: "0 14px 34px rgba(11,35,67,0.12)",
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                {/* Top row: avatar + meta */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Link
                      href={`/profile/${item.curiosoHandle}`}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg,#1e63f3,#00a9a5)",
                          display: "grid",
                          placeItems: "center",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 900,
                        }}
                      >
                        {item.curiosoName.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: NAVY,
                          }}
                        >
                          {item.curiosoName}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(11,35,67,0.7)",
                          }}
                        >
                          @{item.curiosoHandle}
                        </div>
                      </div>
                    </Link>
                    <span
                      style={{
                        marginLeft: 4,
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 750,
                        background: "rgba(30,99,243,0.06)",
                        border: "1px solid rgba(30,99,243,0.3)",
                        color: BLUE,
                      }}
                    >
                      {item.relationshipTag}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(11,35,67,0.7)",
                      }}
                    >
                      {item.timeLabel}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 750,
                          background: "rgba(0,169,165,0.06)",
                          border: "1px solid rgba(0,169,165,0.4)",
                          color: TEAL,
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 750,
                          background:
                            item.status === "Resolved"
                              ? "rgba(255,107,107,0.08)"
                              : "rgba(30,99,243,0.08)",
                          border:
                            item.status === "Resolved"
                              ? "1px solid rgba(255,107,107,0.4)"
                              : "1px solid rgba(30,99,243,0.4)",
                          color: item.status === "Resolved" ? CORAL : BLUE,
                        }}
                      >
                        {item.status}
                      </span>
                      {item.status === "Resolved" && item.curiosoChoice && (
                        <span
                          style={{
                            padding: "3px 7px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 750,
                            background: "rgba(255,107,107,0.06)",
                            border: "1px solid rgba(255,107,107,0.45)",
                            color: CORAL,
                          }}
                        >
                          Curioso chose {item.curiosoChoice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lenses */}
                {item.lenses.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {item.lenses.map((lens) => (
                      <span
                        key={lens}
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          border: "1px solid rgba(11,35,67,0.10)",
                          background: "#ffffff",
                          color: "rgba(11,35,67,0.85)",
                        }}
                      >
                        {lens}
                      </span>
                    ))}
                  </div>
                )}

                {/* Question */}
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 850,
                    lineHeight: 1.35,
                  }}
                >
                  {item.question}
                </h2>

                {/* Snippet + stats */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "rgba(11,35,67,0.85)",
                      maxWidth: 580,
                    }}
                  >
                    {item.snippet}
                  </p>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 11,
                      color: "rgba(11,35,67,0.75)",
                    }}
                  >
                    {item.totalVotes} votes · tap to{" "}
                    {item.status === "Resolved"
                      ? "see how people were thinking."
                      : "cast your vote and add your reasoning."}
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#ffffff",
                border: "1px solid rgba(11,35,67,0.08)",
                textAlign: "center",
                fontSize: 13,
                color: "rgba(11,35,67,0.8)",
              }}
            >
              Nothing in your feed with those filters yet. Try switching status
              or categories — or{" "}
              <span style={{ fontWeight: 800 }}>ask the first Quandr3.</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
