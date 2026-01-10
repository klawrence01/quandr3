"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { seedQ } from "@/lib/seedQ";

type Voice = {
  name: string;
  lens: string;
  text: string;
};

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

export default function QPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"choose" | "reveal">("choose");

  // 🔹 SUBTLE VOICES HERE
  const voicesByOption: Record<string, Voice[]> = {
    A: [
      { name: "Maya", lens: "Structure-first", text: "I need a roadmap. If I don’t have structure, I drift." },
      { name: "Derrick", lens: "Money-wise", text: "Credentials matter for raises. A course helps me justify the jump." },
      { name: "Nia", lens: "Long-term", text: "I’d rather build skills properly than rush and get gaps later." },
    ],
    B: [
      { name: "Andre", lens: "Hands-on", text: "I learn faster by building something and fixing what breaks." },
      { name: "Sofia", lens: "Momentum", text: "Small wins keep me going. Projects give me motion from day one." },
      { name: "Jalen", lens: "No-fluff", text: "Projects expose weak spots quick. You can’t hide from reality." },
    ],
    C: [
      { name: "Tasha", lens: "Community-driven", text: "Other people keep me consistent when motivation dips." },
      { name: "Eli", lens: "Shared thinking", text: "Seeing how others solve the same problem unlocks insight." },
      { name: "Ramon", lens: "Avoid stuck", text: "Being stuck alone kills progress. People help me push through." },
    ],
    D: [
      { name: "Leah", lens: "Cautious", text: "I like to test before committing. It saves me time and regret." },
      { name: "Chris", lens: "Low-risk", text: "Short trials help me figure out if it’s worth real effort." },
      { name: "Kira", lens: "Fit matters", text: "I’m choosing a learning style. Sampling shows what fits me." },
    ],
  };

  const widthByOption: Record<string, string> = {
    A: "36",
    B: "33",
    C: "18",
    D: "13",
  };

  const winningOptionId = useMemo(() => {
    let best: string | null = null;
    let max = -1;
    for (const [k, v] of Object.entries(widthByOption)) {
      const num = parseFloat(v);
      if (num > max) {
        max = num;
        best = k;
      }
    }
    return best;
  }, []);

  const colorCycle = [BLUE, TEAL, CORAL];

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "48px 24px 64px",
        lineHeight: 1.6,
        background: SOFT_BG,
        minHeight: "100vh",
        color: NAVY,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      {/* HEADER */}
      <section style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 12 }}>
          {seedQ.title}
        </h1>

        <p style={{ fontSize: 17, opacity: 0.9, marginBottom: 10 }}>
          {seedQ.context}
        </p>

        {id && (
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>
            Quandr3 ID · {id}
          </p>
        )}

        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 0 }}>
          There’s no single right answer — just different ways to think about the same choice.
        </p>
      </section>

      {/* CHOOSE STEP */}
      {phase === "choose" && (
        <>
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {seedQ.options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: 16,
                    padding: 18,
                    cursor: "pointer",
                    border: isSelected
                      ? `2px solid ${BLUE}`
                      : "1px solid rgba(11,35,67,0.12)",
                    background: isSelected ? "#ffffff" : "rgba(247,249,255,0.9)",
                    boxShadow: isSelected
                      ? "0 16px 36px rgba(11,35,67,0.14)"
                      : "0 8px 18px rgba(11,35,67,0.06)",
                    transition: "all 0.18s ease",
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
                    <strong style={{ fontSize: 18, fontWeight: 850 }}>
                      {option.id}. {option.label}
                    </strong>

                    {isSelected && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(30,99,243,0.10)",
                          color: BLUE,
                          border: "1px solid rgba(30,99,243,0.6)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        Your pick
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </section>

          {selected && (
            <div>
              <button
                onClick={() => setPhase("reveal")}
                style={{
                  padding: "14px 26px",
                  fontSize: 14,
                  borderRadius: 999,
                  border: "none",
                  background: BLUE,
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  boxShadow: "0 16px 40px rgba(30,99,243,0.35)",
                }}
              >
                See how others think
              </button>
              <p style={{ marginTop: 10, fontSize: 12, opacity: 0.72 }}>
                Your answer locks first. Then you’ll see how different thinkers approached it.
              </p>
            </div>
          )}
        </>
      )}

      {/* REVEAL STEP */}
      {phase === "reveal" && (
        <section style={{ marginTop: 40, display: "grid", gap: 24 }}>
          {/* Reveal header */}
          <div
            style={{
              borderRadius: 22,
              background: "#ffffff",
              padding: 18,
              boxShadow: "0 18px 48px rgba(11,35,67,0.14)",
              border: "1px solid rgba(11,35,67,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(11,35,67,0.78)",
                marginBottom: 6,
              }}
            >
              Quandr3 Reveal
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                margin: "0 0 4px",
              }}
            >
              How people approached this
            </h2>
            <p style={{ fontSize: 13, opacity: 0.78, margin: 0 }}>
              People can agree on an answer for different reasons. This shows you the spread.
            </p>
          </div>

          {/* Breakdown */}
          {seedQ.options.map((option) => {
            const isMine = selected === option.id;
            const voices = voicesByOption[option.id] ?? [];
            const pct = parseFloat(widthByOption[option.id] ?? "25");
            const isWinner = option.id === winningOptionId;

            return (
              <div
                key={option.id}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  background: "#ffffff",
                  border: isMine
                    ? `1px solid ${BLUE}`
                    : "1px solid rgba(11,35,67,0.08)",
                  boxShadow: isMine
                    ? "0 16px 40px rgba(30,99,243,0.25)"
                    : "0 10px 26px rgba(11,35,67,0.10)",
                }}
              >
                {/* header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 16, fontWeight: 850 }}>
                      {option.id}. {option.label}
                    </strong>

                    {isWinner && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "rgba(0,169,165,0.10)",
                          color: TEAL,
                          border: "1px solid rgba(0,169,165,0.65)",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Most chosen
                      </span>
                    )}

                    {isMine && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "rgba(30,99,243,0.10)",
                          color: BLUE,
                          border: "1px solid rgba(30,99,243,0.65)",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Your choice
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 750,
                      color: "rgba(11,35,67,0.85)",
                    }}
                  >
                    ~{pct}%
                  </div>
                </div>

                {/* distribution bar */}
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(11,35,67,0.06)",
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(pct, 8)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: isWinner ? BLUE : TEAL,
                      transition: "width 0.25s ease",
                    }}
                  />
                </div>

                {/* Voices */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {voices.slice(0, 3).map((v, idx) => {
                    const color = colorCycle[idx % colorCycle.length];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: 12,
                          borderRadius: 14,
                          background: "rgba(247,249,255,0.9)",
                          border: "1px solid rgba(11,35,67,0.08)",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            background: color,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "#ffffff",
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {v.name.charAt(0).toUpperCase()}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <strong style={{ fontSize: 13 }}>{v.name}</strong>
                            <span
                              style={{
                                fontSize: 11,
                                opacity: 0.9,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "#ffffff",
                                border: "1px solid rgba(11,35,67,0.12)",
                                fontWeight: 700,
                                color: NAVY,
                              }}
                            >
                              {v.lens}
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: 13,
                              opacity: 0.94,
                              margin: 0,
                            }}
                          >
                            {v.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.78 }}>
            Seeing different reasoning styles is the fun part. Post your own Quandr3 and test the crowd.
          </div>
        </section>
      )}
    </main>
  );
}
