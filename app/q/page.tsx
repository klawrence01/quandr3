"use client";

import { useState } from "react";
import { seedQ } from "@/lib/seedQ";

type Voice = {
  name: string;
  lens: string;
  color: string; // circle color
  text: string;
};

export default function QPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"choose" | "reveal">("choose");

  const voicesByOption: Record<string, Voice[]> = {
    A: [
      {
        name: "Maya",
        lens: "Structure-first",
        color: "#60a5fa", // blue
        text: "If I don’t have a plan, I drift. A course keeps me consistent when motivation dips.",
      },
      {
        name: "Derrick",
        lens: "Career-focused",
        color: "#34d399", // green
        text: "I’m learning for a career upgrade, so a curriculum and credential matters to me.",
      },
      {
        name: "Nia",
        lens: "Clarity-seeker",
        color: "#f59e0b", // amber
        text: "I like a clear path so I don’t waste time guessing what to learn next.",
      },
    ],
    B: [
      {
        name: "Andre",
        lens: "Hands-on",
        color: "#a78bfa", // purple
        text: "I learn fastest by building something immediately, even if it’s messy at first.",
      },
      {
        name: "Sofia",
        lens: "Momentum",
        color: "#fb7185", // rose
        text: "Quick wins keep me going. Small projects give me motion without overthinking.",
      },
      {
        name: "Jalen",
        lens: "Reality-check",
        color: "#22c55e", // green
        text: "Projects expose what I don’t understand way faster than lessons do.",
      },
    ],
    C: [
      {
        name: "Tasha",
        lens: "Accountability",
        color: "#38bdf8", // sky
        text: "Community keeps me honest when I start slipping. It’s harder to disappear.",
      },
      {
        name: "Eli",
        lens: "Shared thinking",
        color: "#f97316", // orange
        text: "I learn best by seeing how people think through the same problem.",
      },
      {
        name: "Ramon",
        lens: "Avoid stuck",
        color: "#94a3b8", // slate
        text: "I don’t want to get stuck alone. Having people to ask saves time and frustration.",
      },
    ],
    D: [
      {
        name: "Leah",
        lens: "Experimenter",
        color: "#818cf8", // indigo
        text: "I try a few approaches first so I don’t commit hard to the wrong method.",
      },
      {
        name: "Chris",
        lens: "Low-risk",
        color: "#10b981", // emerald
        text: "A short test run gives me clarity before I invest real time or money.",
      },
      {
        name: "Kira",
        lens: "Fit matters",
        color: "#e879f9", // fuchsia
        text: "I don’t really know how I learn best until I sample a few paths.",
      },
    ],
  };

  const widthByOption: Record<string, string> = {
    A: "36%",
    B: "33%",
    C: "18%",
    D: "13%",
  };

  return (
    <main
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "48px 24px",
        lineHeight: 1.6,
      }}
    >
      {/* Question */}
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        {seedQ.title}
      </h1>

      <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 12 }}>
        {seedQ.context}
      </p>

      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 40 }}>
        There’s no right answer here — just different ways people think about it.
      </p>

      {/* OPTIONS */}
      {phase === "choose" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {seedQ.options.map((option) => {
              const isSelected = selected === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelected(option.id)}
                  style={{
                    border: isSelected
                      ? "2px solid #2563eb"
                      : "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 22,
                    cursor: "pointer",
                    background: isSelected ? "#f0f7ff" : "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                >
                  <strong style={{ fontSize: 18 }}>
                    {option.id}. {option.label}
                  </strong>
                </div>
              );
            })}
          </div>

          {selected && (
            <div style={{ marginTop: 40 }}>
              <button
                onClick={() => setPhase("reveal")}
                style={{
                  padding: "14px 24px",
                  fontSize: 16,
                  borderRadius: 10,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                See how others think
              </button>
            </div>
          )}
        </>
      )}

      {/* REVEAL */}
      {phase === "reveal" && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>
            How people approached this
          </h2>

          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 32 }}>
            People often arrive at similar choices for very different reasons.
          </p>

          {seedQ.options.map((option) => {
            const isMine = selected === option.id;
            const voices = voicesByOption[option.id] ?? [];

            return (
              <div
                key={option.id}
                style={{
                  marginBottom: 28,
                  padding: 18,
                  borderRadius: 12,
                  background: isMine ? "#f0f7ff" : "#f9fafb",
                  border: isMine
                    ? "1px solid #2563eb"
                    : "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    {option.id}. {option.label}
                  </strong>

                  {isMine && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#2563eb",
                        fontWeight: 600,
                      }}
                    >
                      Your choice
                    </span>
                  )}
                </div>

                {/* Distribution (stub) */}
                <div
                  style={{
                    height: 8,
                    background: "#e5e7eb",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: widthByOption[option.id] ?? "25%",
                      height: "100%",
                      background: "#93c5fd",
                    }}
                  />
                </div>

                {/* Voices */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {voices.slice(0, 3).map((v, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {/* colored circle */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: v.color,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />

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
                          <strong style={{ fontSize: 14 }}>{v.name}</strong>
                          <span
                            style={{
                              fontSize: 12,
                              opacity: 0.75,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#f3f4f6",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {v.lens}
                          </span>
                        </div>

                        <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
                          {v.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
