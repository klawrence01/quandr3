// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT = "#f5f7fc";

type Quandr3Row = {
  id: string;
  category: string;
  status: "Open" | "Resolved" | string;
  created_at: string;
};

type CategoryStat = {
  category: string;
  total: number;
  open: number;
  resolved: number;
  lastActivity: string | null;
};

export default function LeaderboardPage() {
  const [items, setItems] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      // You can bump the limit later; 1000 is a safe MVP cap.
      const { data, error } = await supabase
        .from("quandr3s")
        .select("id, category, status, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error(error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setItems((data || []) as Quandr3Row[]);
      setLoading(false);
    }

    load();
  }, []);

  const totalCount = items.length;
  const totalOpen = items.filter((q) => q.status === "Open").length;
  const totalResolved = items.filter((q) => q.status === "Resolved").length;
  const distinctCategories = new Set(items.map((q) => q.category)).size;

  const categoryStats: CategoryStat[] = useMemo(() => {
    const map = new Map<string, CategoryStat>();

    for (const q of items) {
      if (!q.category) continue;
      const existing = map.get(q.category) || {
        category: q.category,
        total: 0,
        open: 0,
        resolved: 0,
        lastActivity: null as string | null,
      };

      existing.total += 1;
      if (q.status === "Open") existing.open += 1;
      if (q.status === "Resolved") existing.resolved += 1;

      // track latest activity per category
      if (!existing.lastActivity) {
        existing.lastActivity = q.created_at;
      } else {
        const prev = new Date(existing.lastActivity).getTime();
        const curr = new Date(q.created_at).getTime();
        if (curr > prev) existing.lastActivity = q.created_at;
      }

      map.set(q.category, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [items]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "80px 24px 40px",
        fontFamily: "system-ui",
        maxWidth: 1120,
        margin: "0 auto",
        background: SOFT,
        color: NAVY,
      }}
    >
      {/* HERO / INTRO */}
      <section style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            margin: 0,
            color: BLUE,
          }}
        >
          QUANDR3 LEADERBOARDS
        </p>
        <h1
          style={{
            fontSize: 34,
            lineHeight: 1.1,
            fontWeight: 900,
            margin: "8px 0 10px",
          }}
        >
          See what the community is wrestling with most.
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 620,
            color: "rgba(11,35,67,0.9)",
          }}
        >
          These leaderboards show which categories are heating up on Quandr3.
          Each category is ranked by how many Quandr3s have been posted, how
          many are still open, and when the last decision went live.
        </p>
      </section>

      {/* TOP STATS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Quandr3s (sample)"
          value={totalCount}
          hint="Based on the latest 1,000"
        />
        <StatCard
          label="Open Quandr3s"
          value={totalOpen}
          hint="Still accepting Wayfinders"
        />
        <StatCard
          label="Resolved Quandr3s"
          value={totalResolved}
          hint="Curioso has made a call"
        />
        <StatCard
          label="Active Categories"
          value={distinctCategories}
          hint="At least one Quandr3 posted"
        />
      </section>

      {/* STATUS */}
      {message && (
        <p
          style={{
            color: CORAL,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {message}
        </p>
      )}

      {loading && (
        <p
          style={{
            fontSize: 14,
            color: "rgba(11,35,67,0.9)",
            marginBottom: 16,
          }}
        >
          Loading leaderboards…
        </p>
      )}

      {!loading && !message && categoryStats.length === 0 && (
        <p
          style={{
            fontSize: 14,
            color: "rgba(11,35,67,0.9)",
            marginBottom: 16,
          }}
        >
          No Quandr3s found yet. Once people start posting, category
          leaderboards will appear here.
        </p>
      )}

      {/* CATEGORY LEADERBOARD TABLE */}
      {categoryStats.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 12,
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                Top Categories (All-Time Sample)
              </h2>
              <p
                style={{
                  fontSize: 11,
                  margin: "4px 0 0",
                  color: "rgba(11,35,67,0.8)",
                }}
              >
                Ranked by total Quandr3s posted. Sample includes the latest{" "}
                {totalCount} Quandr3{totalCount === 1 ? "" : "s"}.
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: TEAL,
                textTransform: "uppercase",
              }}
            >
              User &amp; Wayfinder leaderboards coming soon
            </span>
          </div>

          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "0 16px 45px rgba(15,23,42,0.12)",
              border: "1px solid rgba(11,35,67,0.06)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead
                style={{
                  background: "rgba(11,35,67,0.03)",
                  textAlign: "left",
                }}
              >
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Open</th>
                  <th style={thStyle}>Resolved</th>
                  <th style={thStyle}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat, index) => {
                  const isTop = index === 0;
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={cat.category}
                      style={{
                        background: isTop
                          ? "rgba(30,99,243,0.05)"
                          : isEven
                          ? "rgba(11,35,67,0.008)"
                          : "transparent",
                      }}
                    >
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 24,
                            height: 24,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isTop
                              ? `linear-gradient(135deg, ${BLUE}, ${TEAL})`
                              : "rgba(11,35,67,0.06)",
                            color: isTop ? "#ffffff" : NAVY,
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {cat.category || "Uncategorized"}
                        </span>
                      </td>
                      <td style={tdStyle}>{cat.total}</td>
                      <td style={tdStyle}>{cat.open}</td>
                      <td style={tdStyle}>{cat.resolved}</td>
                      <td style={tdStyle}>
                        {cat.lastActivity
                          ? new Date(cat.lastActivity).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "rgba(11,35,67,0.9)",
  borderBottom: "1px solid rgba(11,35,67,0.08)",
};

const tdStyle: React.CSSProperties = {
  padding: "9px 14px",
  borderBottom: "1px solid rgba(11,35,67,0.04)",
  fontSize: 13,
  color: "rgba(11,35,67,0.95)",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: "#ffffff",
        boxShadow: "0 14px 35px rgba(15,23,42,0.12)",
        border: "1px solid rgba(11,35,67,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          fontWeight: 800,
          color: "rgba(11,35,67,0.85)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: NAVY,
        }}
      >
        {value}
      </span>
      {hint && (
        <span
          style={{
            fontSize: 11,
            color: "rgba(11,35,67,0.85)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
