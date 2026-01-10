"use client";

import Link from "next/link";
import Quandr3Card, { Quandr3Mock } from "./components/Quandr3Card";

const blue = "#0F3D91";
const teal = "#00A6A6";
const coral = "#FF6B6B";
const pageBg = "#F6F9FF";
const textMain = "#0B0B1E";
const textSubtle = "#4B5563";
const border = "rgba(12,38,80,0.10)";

const FEATURED: Quandr3Mock[] = [
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
    choices: ["Blue shoes", "Red shoes", "Boots", "Other color"],
    votes: 1204,
    status: "Open",
  },
  {
    id: "rel-020",
    poster: { name: "A. Friend" },
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

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: textMain,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* HEADER SHELL */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 24px",
          background: "#ffffff",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              padding: 4,
              background:
                "conic-gradient(from 210deg, #0F3D91 0deg, #0F3D91 90deg, #FF6B6B 90deg, #FF6B6B 180deg, #00A6A6 180deg, #00A6A6 360deg)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 10,
                background: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 20,
                color: blue,
              }}
            >
              ?
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: blue }}>
              QUANDR3
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              A people-powered clarity engine.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Pill color={teal}>Guest mode</Pill>
          <Pill soft color={coral}>Active: None</Pill>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* HERO */}
          <section style={{ maxWidth: 720 }}>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 980,
                letterSpacing: -0.6,
                lineHeight: 1.05,
              }}
            >
              Ask. Share. Decide.
            </h1>

            <p
              style={{
                marginTop: 18,
                fontSize: 20,
                lineHeight: 1.45,
                color: textSubtle,
              }}
            >
              <strong>Why be stuck?</strong> See how others choose. Decide what’s
              right for you.
            </p>

            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/explore"
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: blue,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Explore Quandr3s
              </Link>

              <Link
                href="/create"
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  textDecoration: "none",
                  fontWeight: 900,
                  color: textMain,
                }}
              >
                Create a Quandr3
              </Link>
            </div>
          </section>

          {/* DIVIDER */}
          <hr
            style={{
              margin: "72px 0",
              border: "none",
              borderTop: `1px solid ${border}`,
            }}
          />

          {/* HOW IT WORKS */}
          <section>
            <h2 style={{ fontSize: 28, fontWeight: 980 }}>How Quandr3 works</h2>

            <div
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
              }}
            >
              {[
                {
                  step: "Ask",
                  text:
                    "Post a real question with clear options. Add images or a short video if it helps.",
                },
                {
                  step: "Share",
                  text:
                    "Others vote anonymously. Percentages stay hidden until you vote.",
                },
                {
                  step: "Decide",
                  text:
                    "You resolve the Quandr3. People who matched your choice earn points.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontWeight: 980, fontSize: 18 }}>{item.step}</div>
                  <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.45, color: textSubtle }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* WHY QUANDR3 */}
          <section style={{ marginTop: 56 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 980 }}>Why Quandr3?</h2>
                <p style={{ marginTop: 8, color: textSubtle, maxWidth: 820 }}>
                  Because a lot of our dilemmas feel private — and we think we
                  have to carry them alone. What may be new or overwhelming to
                  you is often familiar to someone else. Quandr3 is a safe place
                  to find support, get perspective, and move forward.
                </p>
              </div>

              <Link
                href="/about"
                style={{
                  fontWeight: 950,
                  textDecoration: "underline",
                  color: textMain,
                }}
              >
                Read more →
              </Link>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  title: "Relief matters",
                  body:
                    "Sometimes the win isn’t the “perfect” answer — it’s feeling less alone and more steady about your next step.",
                },
                {
                  title: "Perspective is out there",
                  body:
                    "Your situation may be new to you. But there’s someone who’s been there — and their insight can help.",
                },
                {
                  title: "You keep control",
                  body:
                    "Quandr3 doesn’t tell you what to do. You see how others would choose, then you make the call that’s right for you.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontWeight: 980, fontSize: 16 }}>{card.title}</div>
                  <p
                    style={{
                      marginTop: 8,
                      color: textSubtle,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURED */}
          <section style={{ marginTop: 56 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 980 }}>Featured Quandr3s</h2>
                <p style={{ marginTop: 8, color: textSubtle, maxWidth: 780 }}>
                  A few real examples so you can see how it works before you post.
                </p>
              </div>

              <Link
                href="/explore"
                style={{
                  fontWeight: 950,
                  textDecoration: "underline",
                  color: textMain,
                }}
              >
                View all →
              </Link>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
              {FEATURED.map((q) => (
                <Quandr3Card key={q.id} q={q} />
              ))}
            </div>
          </section>

          {/* FOOTER CTA */}
          <section
            style={{
              marginTop: 80,
              padding: 32,
              borderRadius: 20,
              border: `1px solid ${border}`,
              background: "#ffffff",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: 24, fontWeight: 980 }}>
              Get unstuck with real input
            </h3>
            <p style={{ marginTop: 10, fontSize: 16, color: textSubtle }}>
              Quandr3 isn’t about telling you what to do — it’s about helping you
              see how others would choose.
            </p>

            <Link
              href="/create"
              style={{
                display: "inline-block",
                marginTop: 18,
                padding: "14px 20px",
                borderRadius: 12,
                background: blue,
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              Ask your first question
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function Pill({
  children,
  color,
  soft,
}: {
  children: React.ReactNode;
  color: string;
  soft?: boolean;
}) {
  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: soft ? `1px solid ${border}` : "none",
        background: soft ? "#ffffff" : "rgba(255,255,255,0.9)",
        boxShadow: soft ? "none" : "0 4px 10px rgba(0,0,0,0.06)",
        fontSize: 12,
        fontWeight: 700,
        color,
      }}
    >
      {children}
    </span>
  );
}
