"use client";

import { useMemo } from "react";
import Quandr3Card, { Quandr3Mock } from "../../components/Quandr3Card";

// ---- COLOR SYSTEM (same as Home/Explore/Create) ----
const colors = {
  pageBg: "#F6F9FF",
  cardBg: "#FFFFFF",
  border: "rgba(0,0,0,0.10)",
  textMain: "#0B1220",
  textSub: "#4B5563",
  textMuted: "#94A3B8",
  blue: "#2563EB",
};

const MOCK: Quandr3Mock[] = [
  {
    id: "money-001",
    poster: { name: "Ken L." },
    category: "Money",
    title: "Pay off the card or stack cash?",
    context:
      "I’ve got $1,200 extra this month. High APR on the card, but I also want an emergency cushion.",
    location: "Connecticut • Local",
    time: "2h ago",
    media: "video",
    layout: "grid4",
    choices: ["Pay card", "Build savings", "Split 70/30", "Other plan"],
    votes: 318,
    status: "Open",
  },
  {
    id: "style-011",
    poster: { name: "Jaxon L." },
    category: "Style",
    title: "Which shoes with this dress?",
    context:
      "The dress has multiple colors. I can match blue, go bold with red, or go grounded with boots.",
    location: "New York • State",
    time: "6h ago",
    media: "images",
    layout: "grid4",
    choices: ["Blue shoes", "Red shoes", "Boots", "Other"],
    votes: 1204,
    status: "Open",
  },
  {
    id: "rel-020",
    poster: { name: "Anonymous" },
    category: "Relationships",
    title: "Do I address this now or let it go?",
    context:
      "A friend made a comment that rubbed me the wrong way. Not sure if it’s worth a conversation.",
    location: "Online • Global",
    time: "1d ago",
    media: "images",
    layout: "grid4",
    choices: ["Address it", "Let it go", "Ask for clarity", "Other"],
    votes: 892,
    status: "Resolved",
  },
];

// Map slug → category label
const CATEGORY_LABELS: Record<string, string> = {
  money: "Money",
  style: "Style",
  relationships: "Relationships",
};

export default function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const activeCategory = CATEGORY_LABELS[slug] ?? null;

  const filtered = useMemo(() => {
    if (!activeCategory) return MOCK;
    return MOCK.filter((q) => q.category === activeCategory);
  }, [activeCategory]);

  const heading = activeCategory
    ? `${activeCategory} Quandr3s`
    : "Category Quandr3s";

  const helper = activeCategory
    ? `Real questions about ${activeCategory.toLowerCase()}. Different curiosos, different reasoning — same category.`
    : "Questions grouped by theme. Every category reveals different perspectives and patterns.";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        color: colors.textMain,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <main style={{ padding: "48px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: 18,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 800,
                color: colors.blue,
                margin: 0,
              }}
            >
              Category board
            </p>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: -0.4,
                margin: 0,
              }}
            >
              {heading}
            </h1>
            <p
              style={{
                margin: 0,
                marginTop: 6,
                color: colors.textSub,
                fontSize: 15,
              }}
            >
              {helper}
            </p>
            {activeCategory && (
              <p
                style={{
                  margin: 0,
                  marginTop: 4,
                  color: colors.textMuted,
                  fontSize: 13,
                }}
              >
                URL slug: <code>/categories/{slug}</code> (local demo)
              </p>
            )}
          </header>

          {/* Cards: vertical stack, no multi-column grid */}
          <section
            style={{
              marginTop: 20,
              display: "grid",
              gap: 16,
            }}
          >
            {filtered.map((q) => (
              <Quandr3Card key={q.id} q={q} />
            ))}

            {filtered.length === 0 && (
              <div
                style={{
                  borderRadius: 18,
                  padding: 18,
                  border: `1px dashed ${colors.border}`,
                  background: colors.cardBg,
                  fontSize: 14,
                  color: colors.textSub,
                }}
              >
                No demo Quandr3s yet for this category. Once live data is wired
                in, this board will show all open and resolved Quandr3s tagged
                <strong> {activeCategory ?? slug}</strong>.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
