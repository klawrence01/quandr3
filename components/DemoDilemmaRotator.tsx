// /components/DemoDilemmaRotator.tsx
// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type DemoOption = {
  label: "A" | "B" | "C" | "D";
  text: string;
};

type DemoDilemma = {
  id: string;
  category: string;
  title: string;
  context: string;
  closes_in_minutes: number; // used to render rounded time blocks
  perspectives: number; // realistic number
  options: DemoOption[];
  // pre-baked result for demo
  result: {
    winner_label: "A" | "B" | "C" | "D";
    percents: Record<string, number>; // {A: 60, B: 40}
    reasons: Record<string, string[]>; // {A:[..], B:[..]}
  };
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatTimeLeft(mins: number) {
  if (!Number.isFinite(mins)) return "Closes soon";
  if (mins < 0) return "Closed";
  if (mins < 60) return `Closes in ${Math.max(1, Math.round(mins))}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem === 0 ? `Closes in ${hrs}h` : `Closes in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Closes in ${days}d`;
}

function urgencyBadge(mins: number) {
  if (mins < 0) return null;
  if (mins < 60) return { label: "Final Hour", bg: "#fff1f2", fg: "#be123c", border: "1px solid rgba(190,18,60,0.25)" };
  if (mins <= 360) return { label: "Closing Soon", bg: "#fff7ed", fg: "#b45309", border: "1px solid rgba(180,83,9,0.22)" };
  return null;
}

function pctBar(p: number) {
  const w = clamp(p || 0, 0, 100);
  return `${w}%`;
}

const DEMOS: DemoDilemma[] = [
  {
    id: "demo-career",
    category: "Career",
    title: "Should I leave my stable job to start my business full-time?",
    context:
      "I’m 39 with two kids and a mortgage. My startup is starting to gain traction, but my job pays the bills. I can’t afford to fail — but I also can’t ignore the opportunity.",
    closes_in_minutes: 6 * 60 + 10,
    perspectives: 243,
    options: [
      { label: "A", text: "Take the leap and go all in" },
      { label: "B", text: "Stay employed and build on nights/weekends" },
    ],
    result: {
      winner_label: "A",
      percents: { A: 60, B: 40 },
      reasons: {
        A: ["Timing matters — momentum is rare.", "You can rebuild security, but not always opportunity."],
        B: ["Stability buys optionality.", "A slower build can still win — without risking the floor."],
      },
    },
  },
  {
    id: "demo-money",
    category: "Money",
    title: "I just received a $10,000 bonus. Invest it or pay down debt?",
    context:
      "My debt interest isn’t extreme, but it’s always on my mind. I want long-term growth — and I want peace of mind. I can’t do both at 100%.",
    closes_in_minutes: 3 * 60 + 40,
    perspectives: 188,
    options: [
      { label: "A", text: "Invest for growth" },
      { label: "B", text: "Pay down debt first" },
    ],
    result: {
      winner_label: "B",
      percents: { A: 46, B: 54 },
      reasons: {
        A: ["Time in the market beats timing the market.", "Investing keeps future you moving forward."],
        B: ["Debt freedom changes your whole life.", "Less pressure now makes better decisions later."],
      },
    },
  },
  {
    id: "demo-relationships",
    category: "Relationships",
    title: "Do I tell my friend a hard truth, even if it strains our relationship?",
    context:
      "They’re about to make a choice I think will backfire. I care about them, but I don’t want to come off judgmental or controlling.",
    closes_in_minutes: 52, // final hour to show minutes behavior
    perspectives: 301,
    options: [
      { label: "A", text: "Be honest — say it clearly" },
      { label: "B", text: "Stay quiet — let them live it" },
    ],
    result: {
      winner_label: "A",
      percents: { A: 63, B: 37 },
      reasons: {
        A: ["Real friends risk discomfort for your good.", "Say it with love — not ego."],
        B: ["Some lessons can’t be taught — only lived.", "Unasked advice can damage trust."],
      },
    },
  },
  {
    id: "demo-family",
    category: "Family",
    title: "Should we move closer to family or stay for better schools?",
    context:
      "We have support and loved ones in one place, but stronger opportunities and schools in the other. Either choice affects our kids long-term.",
    closes_in_minutes: 9 * 60,
    perspectives: 167,
    options: [
      { label: "A", text: "Prioritize family and support" },
      { label: "B", text: "Prioritize opportunity and schools" },
    ],
    result: {
      winner_label: "A",
      percents: { A: 57, B: 43 },
      reasons: {
        A: ["Support systems are priceless.", "Kids thrive with community and consistency."],
        B: ["Opportunity compounds over time.", "You can build community anywhere — with intention."],
      },
    },
  },
  {
    id: "demo-everyday",
    category: "Lifestyle",
    title: "Buy now or wait six months?",
    context:
      "Prices might rise, but they could also fall. I don’t want to rush — but I also don’t want to miss my window.",
    closes_in_minutes: 5 * 60 + 5,
    perspectives: 214,
    options: [
      { label: "A", text: "Buy now" },
      { label: "B", text: "Wait and reassess" },
    ],
    result: {
      winner_label: "B",
      percents: { A: 48, B: 52 },
      reasons: {
        A: ["If it fits your life today, don’t overthink.", "Time has a cost too — not just money."],
        B: ["Waiting reduces regret.", "Data improves decisions — patience is power."],
      },
    },
  },
];

export default function DemoDilemmaRotator() {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const lastInteractRef = useRef<number>(0);

  const item = useMemo(() => DEMOS[idx], [idx]);

  // reset choice when rotating
  useEffect(() => {
    setChoice(null);
  }, [idx]);

  // auto rotate
  useEffect(() => {
    if (paused) return;

    const t = setInterval(() => {
      const msSinceInteract = Date.now() - (lastInteractRef.current || 0);
      // don’t rotate immediately after a click
      if (msSinceInteract < 5000) return;
      setIdx((n) => (n + 1) % DEMOS.length);
    }, 7000);

    return () => clearInterval(t);
  }, [paused]);

  const badge = urgencyBadge(item.closes_in_minutes);

  function prev() {
    lastInteractRef.current = Date.now();
    setPaused(true);
    setIdx((n) => (n - 1 + DEMOS.length) % DEMOS.length);
  }

  function next() {
    lastInteractRef.current = Date.now();
    setPaused(true);
    setIdx((n) => (n + 1) % DEMOS.length);
  }

  function pick(label: string) {
    lastInteractRef.current = Date.now();
    setPaused(true);
    setChoice(label);
  }

  const chosenPct = choice ? item.result.percents[choice] : null;

  const winner = item.result.winner_label;

  return (
    <section
      style={{
        marginTop: 18,
        borderRadius: 22,
        background: "#ffffff",
        padding: 16,
        boxShadow: "0 18px 48px rgba(15,23,42,0.14)",
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            DEMO DILEMMA • {item.category.toUpperCase()}
          </span>

          <span style={{ fontSize: 12, color: "#64748b" }}>{formatTimeLeft(item.closes_in_minutes)}</span>

          {badge ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 999,
                background: badge.bg,
                color: badge.fg,
                border: badge.border,
              }}
            >
              {badge.label}
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous dilemma"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "#ffffff",
              cursor: "pointer",
              fontWeight: 900,
              color: NAVY,
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next dilemma"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "#ffffff",
              cursor: "pointer",
              fontWeight: 900,
              color: NAVY,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Title + context */}
      <div style={{ fontSize: 18, fontWeight: 950, color: NAVY, lineHeight: 1.25, marginBottom: 8 }}>{item.title}</div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: "#475569",
          background: SOFT_BG,
          border: "1px solid rgba(15,23,42,0.06)",
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {item.context}
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 12 }}>
        {item.options.map((op) => {
          const isChosen = choice === op.label;
          const pct = item.result.percents[op.label] ?? 0;

          return (
            <button
              key={op.label}
              type="button"
              onClick={() => pick(op.label)}
              style={{
                textAlign: "left",
                borderRadius: 16,
                border: isChosen ? `2px solid ${BLUE}` : "1px solid rgba(15,23,42,0.10)",
                background: "#ffffff",
                padding: "12px 12px",
                cursor: "pointer",
                boxShadow: isChosen ? "0 14px 34px rgba(30,99,243,0.18)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: isChosen ? BLUE : "#eef2ff",
                      color: isChosen ? "#fff" : NAVY,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 950,
                      fontSize: 12,
                      flex: "0 0 auto",
                      marginTop: 1,
                    }}
                  >
                    {op.label}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: NAVY }}>{op.text}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{item.perspectives} perspectives shared</div>
                  </div>
                </div>

                {/* reveal % only after click */}
                {choice ? (
                  <div style={{ minWidth: 110, textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: NAVY }}>{pct}%</div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.08)",
                        overflow: "hidden",
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: pctBar(pct),
                          background: op.label === winner ? TEAL : "rgba(30,99,243,0.55)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Results + reasons */}
      {choice ? (
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "#f8fafc",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 950, color: NAVY }}>
              You chose <span style={{ color: BLUE }}>{choice}</span>
              {typeof chosenPct === "number" ? (
                <>
                  . <span style={{ color: "#0f172a" }}>{chosenPct}%</span> chose the same.
                </>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Demo results</span>
              <button
                type="button"
                onClick={() => {
                  lastInteractRef.current = Date.now();
                  setChoice(null);
                }}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(15,23,42,0.12)",
                  background: "#ffffff",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                  color: NAVY,
                }}
              >
                Change vote
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
            {item.options.slice(0, 2).map((op) => {
              const list = item.result.reasons[op.label] || [];
              return (
                <div
                  key={op.label}
                  style={{
                    borderRadius: 16,
                    background: "#ffffff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 950, color: NAVY, marginBottom: 6 }}>
                    Why people chose <span style={{ color: BLUE }}>{op.label}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", fontSize: 13, lineHeight: 1.55 }}>
                    {list.slice(0, 2).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Conversion nudge */}
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: NAVY }}>
            Help someone else decide. It only takes a moment.
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Link href="/explore" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #1e63f3, #00a9a5)",
                  boxShadow: "0 14px 34px rgba(15,23,42,0.25)",
                }}
              >
                See more dilemmas
              </button>
            </Link>

            <Link href="/q/create" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(30,99,243,0.22)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 900,
                  color: NAVY,
                  background: "#ffffff",
                }}
              >
                Create a Quandr3
              </button>
            </Link>

            <button
              type="button"
              onClick={() => next()}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(15,23,42,0.10)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 900,
                color: NAVY,
                background: "#ffffff",
              }}
            >
              Next dilemma →
            </button>
          </div>
        </div>
      ) : (
        // Before vote hint
        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
          Click an option to see how others chose — and why.
        </div>
      )}

      {/* Dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
        {DEMOS.map((d, i) => {
          const active = i === idx;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                lastInteractRef.current = Date.now();
                setPaused(true);
                setIdx(i);
              }}
              aria-label={`Go to demo ${i + 1}`}
              style={{
                width: active ? 18 : 8,
                height: 8,
                borderRadius: 999,
                border: "none",
                background: active ? BLUE : "rgba(15,23,42,0.18)",
                cursor: "pointer",
                transition: "width 140ms ease",
              }}
            />
          );
        })}
      </div>

      {/* Pause note */}
      <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
        {paused ? "Rotation paused after interaction." : "Auto-rotating demo."}{" "}
        {paused ? (
          <button
            type="button"
            onClick={() => {
              lastInteractRef.current = Date.now();
              setPaused(false);
            }}
            style={{
              marginLeft: 6,
              border: "none",
              background: "transparent",
              color: BLUE,
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 11,
              textDecoration: "underline",
            }}
          >
            Resume
          </button>
        ) : null}
      </div>
    </section>
  );
}