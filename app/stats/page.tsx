"use client";

import React from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type CategoryStat = {
  label: string;
  accuracy: number;
  played: number;
};

type MyStats = {
  username: string;
  accuracy: number;
  totalPlayed: number;
  streakDays: number;
  last7DaysActive: number;
  categoryStats: CategoryStat[];
};

function loadMyStats(): MyStats {
  // 🔹 V1: mock data; later wire to Supabase or local prediction logs
  return {
    username: "Ken",
    accuracy: 63,
    totalPlayed: 41,
    streakDays: 3,
    last7DaysActive: 6,
    categoryStats: [
      { label: "Money", accuracy: 72, played: 19 },
      { label: "Style", accuracy: 59, played: 12 },
      { label: "Relationships", accuracy: 81, played: 10 },
      { label: "Other", accuracy: 41, played: 5 },
    ],
  };
}

export default function MyStatsPage() {
  const router = useRouter();
  const stats = loadMyStats();

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
            marginBottom: 20,
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
              My Stats
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(11,35,67,0.78)",
              }}
            >
              How well you read the room on Quandr3.
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

        {/* Main card */}
        <section
          style={{
            borderRadius: 26,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 20,
            display: "grid",
            gap: 18,
          }}
        >
          {/* Overview cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            <MiniStatCard
              label="Prediction accuracy"
              value={`${stats.accuracy}%`}
              accent="primary"
            />
            <MiniStatCard
              label="Quandr3s played"
              value={stats.totalPlayed.toString()}
              accent="teal"
            />
            <MiniStatCard
              label="Current streak"
              value={`${stats.streakDays} days`}
              accent="coral"
            />
          </div>

          {/* Gauge + activity row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            {/* Accuracy gauge */}
            <div
              style={{
                borderRadius: 22,
                border: "1px solid rgba(11,35,67,0.08)",
                padding: 14,
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background:
                    "conic-gradient(#1e63f3 0deg, #1e63f3 226deg, rgba(11,35,67,0.08) 226deg, rgba(11,35,67,0.08) 360deg)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  style={{
                    width: 116,
                    height: 116,
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 12px 30px rgba(11,35,67,0.18)",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 950,
                        color: NAVY,
                        marginBottom: 2,
                      }}
                    >
                      {stats.accuracy}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        color: "rgba(11,35,67,0.7)",
                      }}
                    >
                      Prediction accuracy
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  textAlign: "center",
                  color: "rgba(11,35,67,0.75)",
                }}
              >
                Sharpshooter at 70%+. Oracle at 90%+. Keep climbing.
              </div>
            </div>

            {/* Activity & category breakdown */}
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {/* Last 7 days */}
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(11,35,67,0.08)",
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "rgba(11,35,67,0.85)",
                  }}
                >
                  Last 7 days
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const active = idx < stats.last7DaysActive;
                    const height = active ? 22 + idx * 3 : 10;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: 10,
                          height,
                          borderRadius: 999,
                          background: active
                            ? `linear-gradient(135deg, ${BLUE}, ${TEAL})`
                            : "rgba(11,35,67,0.12)",
                        }}
                      />
                    );
                  })}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(11,35,67,0.75)",
                  }}
                >
                  Active on {stats.last7DaysActive} of the last 7 days.
                </div>
              </div>

              {/* Category breakdown */}
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(11,35,67,0.08)",
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "rgba(11,35,67,0.85)",
                  }}
                >
                  Category breakdown
                </div>

                {stats.categoryStats.map((cat) => (
                  <CategoryRow key={cat.label} stat={cat} />
                ))}
              </div>
            </div>
          </div>

          {/* Links to your Quandr3s */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 10,
              marginTop: 4,
            }}
          >
            <QuickLinkCard
              title="Your open Quandr3s"
              subtitle="See questions still collecting votes."
              onClick={() => {
                // later: route to your open list
              }}
            />
            <QuickLinkCard
              title="Your resolved Quandr3s"
              subtitle="Review how people reasoned with you."
              onClick={() => {
                // later: route to your resolved list
              }}
            />
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: "rgba(11,35,67,0.75)",
              textAlign: "right",
            }}
          >
            V1: Stats use local mock data. Supabase wiring comes next.
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "primary" | "teal" | "coral";
}) {
  const color = accent === "primary" ? BLUE : accent === "teal" ? TEAL : CORAL;

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(11,35,67,0.08)",
        padding: 12,
        background: "#ffffff",
        display: "grid",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "rgba(11,35,67,0.8)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 950,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CategoryRow({ stat }: { stat: CategoryStat }) {
  const width = Math.max(8, Math.min(stat.accuracy, 100));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 3,
        }}
      >
        <span style={{ fontWeight: 750 }}>{stat.label}</span>
        <span style={{ color: "rgba(11,35,67,0.8)" }}>
          {stat.accuracy}% · {stat.played} played
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(11,35,67,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
          }}
        />
      </div>
    </div>
  );
}

function QuickLinkCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        borderRadius: 18,
        border: "1px solid rgba(11,35,67,0.08)",
        background: "#ffffff",
        padding: 12,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 850,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(11,35,67,0.8)",
          marginBottom: 4,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: BLUE,
        }}
      >
        Open →
      </div>
    </button>
  );
}
