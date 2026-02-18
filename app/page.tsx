// app/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;

  // context (prompt-first, context fallback)
  prompt?: string | null;
  context?: string | null;

  city: string | null;
  state?: string | null;

  created_at: string;
  closes_at?: string | null;

  resolved_at?: string | null;
  resolved_choice_label?: string | null;
  resolution_note?: string | null;
};

const FEED_CATEGORIES = [
  "All",
  "Money",
  "Style",
  "Relationships",
  "Career",
  "Lifestyle",
  "Real Estate",
];

// Canonical route for a Quandr3 detail page.
function qHref(id: string) {
  return `/q/${id}`;
}

function fmt(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function statusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "open") return { bg: "#e8f3ff", fg: BLUE, label: "open" };
  if (s === "awaiting_user") return { bg: "#fff4e6", fg: "#b45309", label: "internet decided" };
  if (s === "resolved") return { bg: "#ecfdf5", fg: "#059669", label: "resolved" };
  return { bg: "#f1f5f9", fg: "#334155", label: s || "unknown" };
}

function cleanLabel(x?: any) {
  const s = (x || "").toString().trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(s) ? s : "";
}

function snippet(s?: any, n = 160) {
  const t = (s || "").toString().trim();
  if (!t) return "";
  return t.length > n ? `${t.slice(0, n).trim()}…` : t;
}

export default function HomePage() {
  const [items, setItems] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      const { data, error } = await supabase
        .from("quandr3s")
        .select(
          "id,title,category,status,prompt,context,city,state,created_at,closes_at,resolved_at,resolved_choice_label,resolution_note"
        )
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) {
        console.error("[Home] load quandr3s error", error);
        setMessage(error.message);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((q) => q.category === activeCategory);
  }, [items, activeCategory]);

  const liveItems = useMemo(() => {
    return items.slice(0, 3);
  }, [items]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui",
        paddingBottom: 48,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 20px" }}>
        {/* Top hero + live-right-now panel */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            gap: 32,
            alignItems: "stretch",
          }}
        >
          {/* Left: Hero copy */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 12,
              }}
            >
              REAL PEOPLE. REAL DILEMMAS.
            </div>
            <h1
              style={{
                fontSize: 44,
                lineHeight: 1.05,
                fontWeight: 900,
                color: NAVY,
                margin: 0,
                marginBottom: 12,
              }}
            >
              One person decides.
              <br />
              Everyone learns.
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 520,
                marginBottom: 16,
              }}
            >
              Real decisions deserve real perspective, real reasoning, and real
              closure. Quandr3 closes the loop so you gain clarity — and the
              community gains shared wisdom.
            </p>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "#64748b",
                maxWidth: 520,
                marginBottom: 20,
              }}
            >
              Quandr3 is a{" "}
              <span style={{ fontWeight: 700 }}>clarity engine</span> — a social
              decision platform built around real human perspective. You ask a
              question, real people share their reasoning, and you reveal what
              you chose.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <Link href="/explore" style={{ textDecoration: "none" }}>
                <button
                  type="button"
                  style={{
                    padding: "11px 24px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#ffffff",
                    background:
                      "linear-gradient(135deg, #1e63f3, #00a9a5, #ff6b6b)",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
                  }}
                >
                  Become a Wayfinder
                </button>
              </Link>

              <Link href="/q/create" style={{ textDecoration: "none" }}>
                <button
                  type="button"
                  style={{
                    padding: "11px 20px",
                    borderRadius: 999,
                    border: "1px solid #d0d7ff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 800,
                    color: NAVY,
                    background: "#ffffff",
                  }}
                >
                  Post as a Curioso
                </button>
              </Link>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              No bots. No “hot takes.” Just real choices, real context, and real
              outcomes.
            </p>

            {/* The Quandr3 loop card */}
            <div
              style={{
                marginTop: 26,
                borderRadius: 18,
                background: "#ffffff",
                padding: "14px 16px 14px",
                boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
                border: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  color: "#1e63f3",
                  marginBottom: 6,
                }}
              >
                THE QUANDR3 LOOP
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 4,
                  color: NAVY,
                }}
              >
                Ask → Perspectives → Reasoning → Decision → Outcome → Shared
                wisdom.
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Most platforms stop at the advice. Quandr3 completes the loop so
                helpers get closure and the community gains “unlived
                experience.”
              </p>
            </div>
          </div>

          {/* Right: Live right now panel */}
          <aside
            style={{
              borderRadius: 28,
              background: NAVY,
              padding: "18px 22px 22px",
              boxShadow: "0 28px 70px rgba(15,23,42,0.85)",
              color: "#e5e7eb",
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  color: TEAL,
                  marginBottom: 10,
                }}
              >
                Live right now
              </div>

              {liveItems.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#cbd5f5",
                  }}
                >
                  No live Quandr3s yet. Once people start posting, you’ll see
                  them here.
                </p>
              )}

              {liveItems.map((q, idx) => {
                const b = statusBadge(q.status);
                return (
                  <Link key={q.id} href={qHref(q.id)} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        padding: "12px 4px",
                        borderTop:
                          idx === 0
                            ? "none"
                            : "1px solid rgba(148, 163, 184, 0.3)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: 1,
                            color: "#cbd5e1",
                            textTransform: "uppercase",
                          }}
                        >
                          {q.category}
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: b.bg,
                            color: b.fg,
                          }}
                        >
                          {b.label}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: "#e5e7eb",
                          marginBottom: 6,
                        }}
                      >
                        {q.title}
                      </div>

                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {fmt(q.created_at)}
                        {(q.city || q.state) ? (
                          <>
                            {" "}
                            • {q.city ? q.city : ""}
                            {q.city && q.state ? ", " : ""}
                            {q.state ? q.state : ""}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>

        {/* Category pills */}
        <section style={{ marginTop: 40 }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Browse Quandr3s by category.
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {FEED_CATEGORIES.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 999,
                    border: active ? "none" : "1px solid #d0d7ff",
                    background: active ? BLUE : "#ffffff",
                    color: active ? "#ffffff" : NAVY,
                    fontSize: 13,
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
        <section style={{ marginTop: 22 }}>
          {loading && (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Loading…</p>
          )}
          {message && (
            <p style={{ fontSize: 13, color: "#c0392b" }}>{message}</p>
          )}
          {!loading && !message && filteredItems.length === 0 && (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              No Quandr3s match these filters yet.
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 6,
            }}
          >
            {filteredItems.map((q) => (
              <HomeFeedCard key={q.id} q={q} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HomeFeedCard({ q }: { q: Quandr3Row }) {
  const b = statusBadge(q.status);
  const contextLine = snippet(q.prompt || q.context, 190);

  const finalChoice = cleanLabel(q.resolved_choice_label);
  const note = snippet(q.resolution_note, 200);

  return (
    <Link href={qHref(q.id)} style={{ textDecoration: "none" }}>
      <article
        style={{
          borderRadius: 20,
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(15,23,42,0.14)",
          border: "1px solid rgba(15,23,42,0.06)",
          cursor: "pointer",
          transition: "transform 120ms ease, box-shadow 120ms ease",
          padding: 18,
        }}
      >
        {/* Top row: category + status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            {(q.category || "QUANDR3").toString().toUpperCase()}
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 999,
              background: b.bg,
              color: b.fg,
            }}
          >
            {b.label}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 18,
            fontWeight: 950,
            margin: 0,
            marginBottom: 6,
            color: NAVY,
            lineHeight: 1.25,
          }}
        >
          {q.title}
        </h3>

        {/* Context (prompt-first, context fallback) */}
        {contextLine ? (
          <div
            style={{
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.55,
              marginBottom: 12,
            }}
          >
            {contextLine}
          </div>
        ) : null}

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: q.status?.toLowerCase() === "resolved" ? 12 : 0,
          }}
        >
          <span>
            <span style={{ fontWeight: 800, color: NAVY }}>Posted:</span>{" "}
            {fmt(q.created_at)}
          </span>

          {(q.city || q.state) ? (
            <span>
              • {q.city ? q.city : ""}
              {q.city && q.state ? ", " : ""}
              {q.state ? q.state : ""}
            </span>
          ) : null}

          {q.closes_at ? (
            <span>
              • <span style={{ fontWeight: 800, color: NAVY }}>Closes:</span>{" "}
              {fmt(q.closes_at)}
            </span>
          ) : null}

          {q.resolved_at ? (
            <span>
              • <span style={{ fontWeight: 800, color: NAVY }}>Resolved:</span>{" "}
              {fmt(q.resolved_at)}
            </span>
          ) : null}
        </div>

        {/* Resolved mini-format (no images; matches new vibe) */}
        {q.status?.toLowerCase() === "resolved" ? (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(15,23,42,0.08)",
              background: "#f8fafc",
              padding: 14,
              marginTop: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Curioso Verdict
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#eef2ff",
                  color: NAVY,
                }}
              >
                Final decision:{" "}
                <span style={{ color: BLUE }}>{finalChoice || "—"}</span>
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: TEAL,
                }}
              >
                View full results + reasons →
              </span>
            </div>

            {note ? (
              <div style={{ marginTop: 10, fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
                {note}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Share pill (non-functional placeholder for now) */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          style={{
            marginTop: 14,
            borderRadius: 999,
            border: "none",
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 800,
            background: "#eef2ff",
            color: NAVY,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Share
        </button>
      </article>
    </Link>
  );
}
