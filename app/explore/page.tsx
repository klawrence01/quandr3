"use client";

import React, { useState } from "react";
import Link from "next/link";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type Category = "Money" | "Style" | "Relationships";
type Status = "Open" | "Resolved";

type ExploreCard = {
  id: string;
  category: Category;
  status: Status;
  question: string;
  curiosoChoice?: "A" | "B" | "C" | "D";
  totalVotes: number;
  closingIn?: string; // for open ones
  topStat?: string; // small summary line
};

const MOCK_CARDS: ExploreCard[] = [
  {
    id: "bonus-5k",
    category: "Money",
    status: "Resolved",
    question: "I just got a $5,000 bonus. What’s the smartest move right now?",
    curiosoChoice: "B",
    totalVotes: 328,
    topStat: "44% invested for long-term growth.",
  },
  {
    id: "outfit-wedding",
    category: "Style",
    status: "Open",
    question:
      "Friend’s evening wedding, semi-formal. Which look makes the best impression?",
    totalVotes: 91,
    closingIn: "Closes in 6 hours",
    topStat: "Image B is slightly ahead.",
  },
  {
    id: "split-rent-or-move",
    category: "Money",
    status: "Open",
    question:
      "Rent just jumped 20%. Do I split with a roommate, negotiate, or move?",
    totalVotes: 142,
    closingIn: "Closes in 1 day",
    topStat: "Most voters lean toward negotiating first.",
  },
  {
    id: "text-back-or-space",
    category: "Relationships",
    status: "Resolved",
    question:
      "They left me on read after a vulnerable text. Do I reach out again or give space?",
    curiosoChoice: "C",
    totalVotes: 503,
    topStat: "Curioso chose C: give space, then check in once.",
  },
  {
    id: "job-offer-two-cities",
    category: "Money",
    status: "Resolved",
    question:
      "Two job offers, two cities. One pays more, one has better quality of life. Which way do I go?",
    curiosoChoice: "A",
    totalVotes: 267,
    topStat: "Community tilted toward quality of life.",
  },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All");

  const filtered = MOCK_CARDS.filter((card) => {
    const categoryOK =
      activeCategory === "All" || card.category === activeCategory;
    const statusOK = activeStatus === "All" || card.status === activeStatus;
    return categoryOK && statusOK;
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
        {/* Page header */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
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
                Explore Quandr3s
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "rgba(11,35,67,0.8)",
                  maxWidth: 520,
                }}
              >
                Browse real decisions across money, style, and relationships.
                Filter by category or status, tap a Quandr3, and dive into how
                people were thinking.
              </p>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid rgba(11,35,67,0.08)",
                fontSize: 12,
                color: "rgba(11,35,67,0.8)",
                maxWidth: 260,
              }}
            >
              <strong>Tip:</strong> Resolved Quandr3s are like mini masterclasses.
              Open ones are where your vote still helps shape the outcome.
            </div>
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
                opacity: 0.8,
              }}
            >
              Categories
            </span>
            {["All", "Money", "Style", "Relationships"].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActiveCategory(cat as Category | "All")
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
                opacity: 0.8,
              }}
            >
              Status
            </span>
            {[
              { label: "All", value: "All" },
              { label: "Open", value: "Open" },
              { label: "Resolved", value: "Resolved" },
            ].map((s) => {
              const isActive = activeStatus === s.value;
              const color =
                s.value === "Open" ? TEAL : s.value === "Resolved" ? CORAL : NAVY;

              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    setActiveStatus(s.value as Status | "All")
                  }
                  style={{
                    padding: "6px 11px",
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
        </section>

        {/* Card grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 16,
          }}
        >
          {filtered.map((card) => (
            <Link
              key={card.id}
              href={
                card.status === "Resolved"
                  ? `/q/${card.id}`
                  : `/q/${card.id}` // later: could be /q/{id}#live
              }
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <article
                style={{
                  borderRadius: 22,
                  background: "#ffffff",
                  boxShadow: "0 14px 34px rgba(11,35,67,0.10)",
                  padding: 16,
                  display: "grid",
                  gap: 10,
                  height: "100%",
                }}
              >
                {/* Tags row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "4px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 750,
                        background: "rgba(0,169,165,0.06)",
                        border: "1px solid rgba(0,169,165,0.4)",
                        color: TEAL,
                      }}
                    >
                      {card.category}
                    </span>
                    <span
                      style={{
                        padding: "4px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 750,
                        background:
                          card.status === "Resolved"
                            ? "rgba(255,107,107,0.08)"
                            : "rgba(30,99,243,0.08)",
                        border:
                          card.status === "Resolved"
                            ? "1px solid rgba(255,107,107,0.4)"
                            : "1px solid rgba(30,99,243,0.4)",
                        color: card.status === "Resolved" ? CORAL : BLUE,
                      }}
                    >
                      {card.status}
                    </span>
                    {card.status === "Resolved" && card.curiosoChoice && (
                      <span
                        style={{
                          padding: "4px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 750,
                          background: "rgba(255,107,107,0.06)",
                          border: "1px solid rgba(255,107,107,0.45)",
                          color: CORAL,
                        }}
                      >
                        Curioso chose {card.curiosoChoice}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(11,35,67,0.75)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {card.totalVotes} votes
                  </span>
                </div>

                {/* Question */}
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 850,
                    lineHeight: 1.35,
                  }}
                >
                  {card.question}
                </h2>

                {/* Small summary / timing */}
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(11,35,67,0.78)",
                  }}
                >
                  {card.status === "Open" && card.closingIn && (
                    <div>{card.closingIn}</div>
                  )}
                  {card.topStat && <div>{card.topStat}</div>}
                </div>

                {/* Footer */}
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(11,35,67,0.75)",
                    }}
                  >
                    Tap to{" "}
                    {card.status === "Resolved"
                      ? "see how people were thinking."
                      : "add your vote and reasoning."}
                  </div>
                  <div
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg,#1e63f3 0%,#00a9a5 50%,#ff6b6b 100%)",
                      color: "#ffffff",
                      boxShadow: "0 10px 24px rgba(11,35,67,0.30)",
                    }}
                  >
                    View
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 24,
                borderRadius: 22,
                background: "#ffffff",
                border: "1px solid rgba(11,35,67,0.08)",
                textAlign: "center",
                fontSize: 13,
                color: "rgba(11,35,67,0.8)",
              }}
            >
              No Quandr3s match those filters yet. Try switching categories or
              status.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
