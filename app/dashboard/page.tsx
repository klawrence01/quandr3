// app/dashboard/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";
import { ensureProfile } from "@/utils/supabase/profile";

type DashQuandr3 = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  outcome_text: string | null;
};

type VoteRow = {
  id: string;
  quandr3_id: string;
  choice_label: string;
  created_at: string;
};

type VoteWithMeta = VoteRow & {
  quandr3_title: string;
  quandr3_category: string;
  quandr3_status: string;
  quandr3_resolved_choice_label: string | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [quandr3s, setQuandr3s] = useState<DashQuandr3[]>([]);
  const [recentClosed, setRecentClosed] = useState<DashQuandr3 | null>(null);

  const [votesTotal, setVotesTotal] = useState<number | null>(null);
  const [recentVotes, setRecentVotes] = useState<VoteWithMeta[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      const { user, error } = await ensureProfile();
      if (error || !user) {
        setMessage("Please sign in to view your dashboard.");
        setLoading(false);
        return;
      }

      // Load Quandr3s you posted (Curioso)
      const { data: qs, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id, title, category, status, created_at, resolved_at, outcome_text"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (qErr) {
        console.error(qErr);
        setMessage(qErr.message);
      } else {
        const list = qs || [];
        setQuandr3s(list);

        const closed = list
          .filter((q) => q.status === "RESOLVED")
          .sort(
            (a, b) =>
              new Date(b.resolved_at || b.created_at).getTime() -
              new Date(a.resolved_at || a.created_at).getTime()
          )[0] || null;
        setRecentClosed(closed);
      }

      // Load Wayfinder contributions (votes you cast)
      // 1) total count
      const { count: totalVotes, error: countErr } = await supabase
        .from("quandr3_votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!countErr && typeof totalVotes === "number") {
        setVotesTotal(totalVotes);
      }

      // 2) recent votes + their Quandr3s
      const { data: votes, error: vErr } = await supabase
        .from("quandr3_votes")
        .select("id, quandr3_id, choice_label, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (vErr) {
        console.error(vErr);
      } else if (votes && votes.length > 0) {
        const qIds = Array.from(new Set(votes.map((v) => v.quandr3_id)));

        const { data: related, error: rErr } = await supabase
          .from("quandr3s")
          .select(
            "id, title, category, status, resolved_choice_label"
          )
          .in("id", qIds);

        if (rErr) {
          console.error(rErr);
        } else {
          const map: Record<string, any> = {};
          (related || []).forEach((q) => {
            map[q.id] = q;
          });

          const withMeta: VoteWithMeta[] = votes.map((v) => {
            const q = map[v.quandr3_id] || {};
            return {
              ...v,
              quandr3_title: q.title || "Untitled Quandr3",
              quandr3_category: q.category || "Unknown",
              quandr3_status: q.status || "UNKNOWN",
              quandr3_resolved_choice_label:
                q.resolved_choice_label || null,
            };
          });

          setRecentVotes(withMeta);
        }
      }

      setLoading(false);
    }

    load();
  }, []);

  const total = quandr3s.length;
  const openCount = quandr3s.filter((q) => q.status !== "RESOLVED").length;
  const resolvedCount = quandr3s.filter(
    (q) => q.status === "RESOLVED"
  ).length;

  const categoriesFromVotes = Array.from(
    new Set(recentVotes.map((v) => v.quandr3_category))
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "system-ui",
        color: "#0b2343",
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "40px 24px 32px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: -0.3,
                marginBottom: 6,
              }}
            >
              Your Quandr3s
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#4b5c88",
                maxWidth: 520,
              }}
            >
              This is your Curioso dashboard. Track open dilemmas, see what
              you resolved, and revisit the outcomes you’ve shared with the
              community.
            </p>
          </div>

          <Link
            href="/create"
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 14px 32px rgba(9,64,179,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            Post a new Quandr3
          </Link>
        </header>

        {message && (
          <p
            style={{
              fontSize: 14,
              color: "#c0392b",
              marginBottom: 16,
            }}
          >
            {message}
          </p>
        )}

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatCard label="Total Quandr3s" value={total} />
          <StatCard label="Open" value={openCount} />
          <StatCard label="Resolved" value={resolvedCount} />
        </div>

        {/* Most recent closed loop */}
        <section
          style={{
            marginBottom: 32,
            borderRadius: 20,
            border: "1px solid #e1e4ff",
            background: "#f7f8ff",
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "#1e63f3",
              marginBottom: 8,
            }}
          >
            Most recent closed loop
          </div>
          {recentClosed ? (
            <div>
              <Link
                href={`/debug/vote/${recentClosed.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0b2343",
                  textDecoration: "none",
                }}
              >
                {recentClosed.title}
              </Link>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#4b5c88",
                }}
              >
                {new Date(
                  recentClosed.resolved_at || recentClosed.created_at
                ).toLocaleString()}{" "}
                · {recentClosed.category} · RESOLVED
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#37446b",
                }}
              >
                {recentClosed.outcome_text
                  ? recentClosed.outcome_text
                  : "Outcome shared."}
              </div>
            </div>
          ) : (
            <p
              style={{ fontSize: 13, color: "#5b6a92", margin: 0 }}
            >
              You haven’t closed any loops yet. Once you resolve a Quandr3,
              it will appear here.
            </p>
          )}
        </section>

        {/* Open + Resolved columns */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Open */}
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              Open Quandr3s
            </h2>
            {openCount === 0 && (
              <p style={{ fontSize: 13, color: "#5b6a92" }}>
                Nothing open right now. You’re all caught up.
              </p>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {quandr3s
                .filter((q) => q.status !== "RESOLVED")
                .map((q) => (
                  <Link
                    key={q.id}
                    href={`/debug/vote/${q.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: "1px solid #e1e4ff",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "#1e63f3",
                          marginBottom: 4,
                        }}
                      >
                        {q.category} · {q.status}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0b2343",
                        }}
                      >
                        {q.title}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "#5c6c99",
                        }}
                      >
                        Posted{" "}
                        {new Date(q.created_at).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* Resolved list */}
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              Resolved Quandr3s
            </h2>
            {resolvedCount === 0 && (
              <p style={{ fontSize: 13, color: "#5b6a92" }}>
                Once you resolve a Quandr3, it will show up here.
              </p>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {quandr3s
                .filter((q) => q.status === "RESOLVED")
                .map((q) => (
                  <Link
                    key={q.id}
                    href={`/debug/vote/${q.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: "1px solid #e1e4ff",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "#ff6b6b",
                          marginBottom: 4,
                        }}
                      >
                        {q.category} · RESOLVED
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0b2343",
                        }}
                      >
                        {q.title}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "#5c6c99",
                        }}
                      >
                        Resolved{" "}
                        {new Date(
                          q.resolved_at || q.created_at
                        ).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* Wayfinder contributions */}
        <section
          style={{
            marginTop: 36,
            padding: 18,
            borderRadius: 20,
            border: "1px solid #dfe6ff",
            background: "#f7f8ff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  fontWeight: 800,
                  color: "#1e63f3",
                  marginBottom: 4,
                }}
              >
                Your Wayfinder contributions
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#38476e",
                }}
              >
                Track the Quandr3s you’ve helped with — your votes and the
                outcomes you learn from.
              </div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 14,
                background: "#ffffff",
                border: "1px solid #e1e4ff",
                minWidth: 140,
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#5b6a92",
                }}
              >
                Votes cast
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0b2343",
                }}
              >
                {votesTotal !== null ? votesTotal : "—"}
              </div>
              {categoriesFromVotes.length > 0 && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: "#5b6a92",
                  }}
                >
                  In{" "}
                  {categoriesFromVotes
                    .slice(0, 3)
                    .join(", ")}
                  {categoriesFromVotes.length > 3 ? "…" : ""}
                </div>
              )}
            </div>
          </div>

          {recentVotes.length === 0 ? (
            <p style={{ fontSize: 13, color: "#5b6a92", marginTop: 4 }}>
              You haven’t voted on any Quandr3s yet. Browse the home page
              and start Wayfinding to see your contributions here.
            </p>
          ) : (
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gap: 10,
              }}
            >
              {recentVotes.map((v) => {
                const isResolved =
                  v.quandr3_status === "RESOLVED";
                const outcomeLabel =
                  v.quandr3_resolved_choice_label;
                let alignment: string | null = null;

                if (isResolved && outcomeLabel) {
                  alignment =
                    outcomeLabel === v.choice_label
                      ? "Matched the final outcome"
                      : "Different from the final outcome";
                }

                return (
                  <Link
                    key={v.id}
                    href={`/debug/vote/${v.quandr3_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: "#ffffff",
                        border: "1px solid #e1e4ff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: "#1e63f3",
                          }}
                        >
                          {v.quandr3_category} ·{" "}
                          {v.quandr3_status}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#5c6c99",
                          }}
                        >
                          You chose {v.choice_label}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0b2343",
                          marginBottom: 3,
                        }}
                      >
                        {v.quandr3_title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#5c6c99",
                        }}
                      >
                        Voted{" "}
                        {new Date(
                          v.created_at
                        ).toLocaleString()}
                        {alignment && (
                          <> · {alignment}</>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {loading && (
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "#5b6a92",
            }}
          >
            Loading your data…
          </p>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid #e1e4ff",
        background: "#f7f8ff",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.3,
          fontWeight: 800,
          color: "#5b6a92",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "#0b2343",
        }}
      >
        {value}
      </div>
    </div>
  );
}
