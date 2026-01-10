"use client";

import React from "react";
import Link from "next/link";
import GradientButton from "../components/ui/GradientButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type Lens = string;

type Person = {
  id: string;
  displayName: string;
  handle: string;
  avatarInitial: string;
  lenses: Lens[];
  youFollowThem: boolean;
  theyFollowYou: boolean;
  lastActive: string;
};

const MOCK_PEOPLE: Person[] = [
  {
    id: "p1",
    displayName: "CuriosoKen",
    handle: "curiosoken",
    avatarInitial: "K",
    lenses: ["Money-wise", "No-fluff"],
    youFollowThem: true,
    theyFollowYou: true,
    lastActive: "Active today",
  },
  {
    id: "p2",
    displayName: "NumbersNerd",
    handle: "numbersnerd",
    avatarInitial: "N",
    lenses: ["Planner"],
    youFollowThem: true,
    theyFollowYou: false,
    lastActive: "Active 2h ago",
  },
  {
    id: "p3",
    displayName: "StyledByJay",
    handle: "styledbyjay",
    avatarInitial: "J",
    lenses: ["Trendy", "Keep it fun"],
    youFollowThem: true,
    theyFollowYou: true,
    lastActive: "Active 4h ago",
  },
  {
    id: "p4",
    displayName: "HeartCheck",
    handle: "heartcheck",
    avatarInitial: "H",
    lenses: ["Empathy first"],
    youFollowThem: false,
    theyFollowYou: true,
    lastActive: "Active yesterday",
  },
];

export default function DashboardPage() {
  const following = MOCK_PEOPLE.filter((p) => p.youFollowThem);
  const followers = MOCK_PEOPLE.filter((p) => p.theyFollowYou);

  // stub stats for now
  const stats = {
    quandr3Count: 7,
    predictionAccuracy: 72, // %
    followingCount: following.length,
    followerCount: followers.length,
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
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 20,
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
              Your dashboard
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "rgba(11,35,67,0.8)",
                maxWidth: 520,
              }}
            >
              See how your Quandr3s are doing, who you’re connected to, and
              where your best thinking shows up. This is your little control
              room.
            </p>
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
                color: "rgba(11,35,67,0.72)",
                maxWidth: 260,
                textAlign: "right",
              }}
            >
              V1 note: Everything here is local-only sample data. We’ll wire
              real stats and followers when Supabase/Auth goes live.
            </div>
            <GradientButton
              onClick={() => {
                window.location.href = "/home";
              }}
            >
              Back to your feed
            </GradientButton>
          </div>
        </header>

        {/* Stats row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            label="Quandr3s you’ve posted"
            value={stats.quandr3Count.toString()}
            helper="Includes open and resolved."
          />
          <StatCard
            label="Prediction accuracy"
            value={`${stats.predictionAccuracy}%`}
            helper="How often you matched the Curioso’s final choice."
            highlight
          />
          <StatCard
            label="People you follow"
            value={stats.followingCount.toString()}
            helper="Voices that appear more often in your feed."
          />
          <StatCard
            label="People following you"
            value={stats.followerCount.toString()}
            helper="People who want to see how you think."
          />
        </section>

        {/* People lists */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 16,
          }}
        >
          {/* Following */}
          <div
            style={{
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 14px 34px rgba(11,35,67,0.12)",
              padding: 16,
              display: "grid",
              gap: 10,
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
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                People you follow
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(11,35,67,0.75)",
                }}
              >
                {following.length} voice
                {following.length === 1 ? "" : "s"}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "rgba(11,35,67,0.75)",
              }}
            >
              These Curiosos shape your feed. Unfollow anyone whose voice you
              don’t want to see as often.
            </p>

            <div
              style={{
                marginTop: 4,
                maxHeight: 320,
                overflowY: "auto",
                display: "grid",
                gap: 8,
                paddingRight: 4,
              }}
            >
              {following.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  primaryActionLabel="Unfollow"
                  primaryActionVariant="danger"
                />
              ))}

              {following.length === 0 && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px dashed rgba(11,35,67,0.16)",
                    fontSize: 12,
                    color: "rgba(11,35,67,0.75)",
                  }}
                >
                  You’re not following anyone yet. As you explore the feed,
                  you’ll be able to follow thinkers whose reasoning you like.
                </div>
              )}
            </div>
          </div>

          {/* Followers */}
          <div
            style={{
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 14px 34px rgba(11,35,67,0.12)",
              padding: 16,
              display: "grid",
              gap: 10,
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
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                People following you
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(11,35,67,0.75)",
                }}
              >
                {followers.length} follower
                {followers.length === 1 ? "" : "s"}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "rgba(11,35,67,0.75)",
              }}
            >
              These are the people who care how you think. You can follow them
              back, or just appreciate that they’re here.
            </p>

            <div
              style={{
                marginTop: 4,
                maxHeight: 320,
                overflowY: "auto",
                display: "grid",
                gap: 8,
                paddingRight: 4,
              }}
            >
              {followers.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  primaryActionLabel={
                    person.youFollowThem ? "Following" : "Follow back"
                  }
                  primaryActionVariant={person.youFollowThem ? "muted" : "primary"}
                />
              ))}

              {followers.length === 0 && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: "1px dashed rgba(11,35,67,0.16)",
                    fontSize: 12,
                    color: "rgba(11,35,67,0.75)",
                  }}
                >
                  No followers yet — and that’s fine. As you post more Quandr3s
                  and share your reasoning, people who resonate with you will
                  start to show up here.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- Small pieces ---------- */

function StatCard({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        background: "#ffffff",
        border: highlight
          ? "1px solid rgba(30,99,243,0.35)"
          : "1px solid rgba(11,35,67,0.06)",
        boxShadow: highlight
          ? "0 16px 40px rgba(30,99,243,0.22)"
          : "0 10px 26px rgba(11,35,67,0.08)",
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(11,35,67,0.7)",
          marginBottom: 4,
          fontWeight: 750,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {helper && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(11,35,67,0.7)",
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}

function PersonRow({
  person,
  primaryActionLabel,
  primaryActionVariant,
}: {
  person: Person;
  primaryActionLabel: string;
  primaryActionVariant: "primary" | "danger" | "muted";
}) {
  const bg =
    primaryActionVariant === "primary"
      ? "linear-gradient(135deg,#1e63f3,#00a9a5)"
      : primaryActionVariant === "danger"
      ? "rgba(255,107,107,0.10)"
      : "rgba(11,35,67,0.03)";

  const border =
    primaryActionVariant === "primary"
      ? "none"
      : primaryActionVariant === "danger"
      ? "1px solid rgba(255,107,107,0.5)"
      : "1px solid rgba(11,35,67,0.15)";

  const color =
    primaryActionVariant === "primary"
      ? "#ffffff"
      : primaryActionVariant === "danger"
      ? CORAL
      : "rgba(11,35,67,0.85)";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(11,35,67,0.08)",
        background: "rgba(247,249,255,0.9)",
        padding: 10,
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
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
          href={`/profile/${person.handle}`}
          style={{
            textDecoration: "none",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#1e63f3,#00a9a5)",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            {person.avatarInitial}
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              {person.displayName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(11,35,67,0.72)",
              }}
            >
              @{person.handle} · {person.lastActive}
            </div>
            {person.lenses.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 3,
                }}
              >
                {person.lenses.map((lens) => (
                  <span
                    key={lens}
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontSize: 10,
                      border: "1px solid rgba(11,35,67,0.12)",
                      background: "#ffffff",
                      color: "rgba(11,35,67,0.85)",
                    }}
                  >
                    {lens}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          // stub only
          alert(
            `${primaryActionLabel} clicked for @${person.handle} (stub – real follow logic later).`
          );
        }}
        style={{
          padding: "7px 11px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          background: bg,
          border,
          color,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {primaryActionLabel}
      </button>
    </div>
  );
}
