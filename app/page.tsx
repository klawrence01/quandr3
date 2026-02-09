// app/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const SOFT_BG = "#f5f7fc";

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  city: string | null;
  created_at: string;
};

// Map categories to the category art in /public/images/categories
const categoryImageMap: Record<string, string> = {
  Money: "/images/categories/money-bonus.jpg",
  Relationships: "/images/categories/relationships.jpg",
  Style: "/images/categories/style.jpg",
  Career: "/images/categories/all.jpg",
  Lifestyle: "/images/categories/all.jpg",
  "Real Estate": "/images/categories/all.jpg",
};

function getCategoryImage(category: string) {
  return categoryImageMap[category] || "/images/categories/all.jpg";
}

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
// If you truly want to keep /debug/vote/[id] on homepage, change this to `/debug/vote/${id}`
function qHref(id: string) {
  return `/q/${id}`;
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
        .select("id, title, category, status, city, created_at")
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

              {liveItems.map((q, idx) => (
                <Link key={q.id} href={qHref(q.id)}>
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
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1,
                        color:
                          q.status === "RESOLVED" ? "#fbbf24" : "#f97373",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {q.category} · {q.status}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#e5e7eb",
                        marginBottom: 4,
                      }}
                    >
                      {q.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      {new Date(q.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
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
  const imageSrc = getCategoryImage(q.category);

  return (
    <Link href={qHref(q.id)}>
      <article
        style={{
          borderRadius: 20,
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(15,23,42,0.14)",
          border: "1px solid rgba(15,23,42,0.06)",
          cursor: "pointer",
          transition: "transform 120ms ease, box-shadow 120ms ease",
        }}
      >
        {/* Image */}
        <div style={{ width: "100%", height: 210, overflow: "hidden" }}>
          <img
            src={imageSrc}
            alt={q.category}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            padding: "14px 18px 14px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: BLUE,
                marginBottom: 4,
              }}
            >
              {q.category} · {q.status}
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 900,
                margin: 0,
                marginBottom: 4,
                color: NAVY,
                lineHeight: 1.35,
              }}
            >
              {q.title}
            </h3>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {q.city ? `${q.city} • ` : ""}
              {new Date(q.created_at).toLocaleString()}
            </div>
          </div>

          {/* Share pill (non-functional placeholder for now) */}
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            style={{
              alignSelf: "flex-end",
              borderRadius: 999,
              border: "none",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              background: "#eef2ff",
              color: NAVY,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Share
          </button>
        </div>
      </article>
    </Link>
  );
}
