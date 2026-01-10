"use client";

import React, { useState } from "react";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

const LENSES = [
  { id: "money", label: "Money decisions", badge: "Bills, bonuses, big buys" },
  { id: "style", label: "Style & image", badge: "Fits, hair, vibe checks" },
  {
    id: "relationships",
    label: "People & relationships",
    badge: "Dating, friends, family",
  },
  {
    id: "career",
    label: "Work & career",
    badge: "Jobs, offers, promotions",
  },
  {
    id: "everyday",
    label: "Everyday life",
    badge: "Little choices that add up",
  },
];

export default function OnboardingStep1Page() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleLens = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  };

  const atLeastOne = selected.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        color: NAVY,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 20px 40px",
        }}
      >
        {/* Simple header – no global nav */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/assets/logo/quandr3-logo.png"
              alt="Quandr3"
              style={{ width: 32, height: 32, borderRadius: 10 }}
            />
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 0.4,
                fontSize: 16,
              }}
            >
              QUANDR3
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(0,169,165,0.08)",
              border: "1px solid rgba(0,169,165,0.4)",
              color: TEAL,
            }}
          >
            Step 1 of 2 · Pick your lenses
          </span>
        </header>

        <section
          style={{
            borderRadius: 26,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11, 35, 67, 0.12)",
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h1
              style={{
                fontSize: 32,
                margin: 0,
                marginBottom: 6,
                fontWeight: 900,
                color: NAVY,
              }}
            >
              What do you want help deciding on?
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "rgba(11, 35, 67, 0.78)",
                maxWidth: 520,
              }}
            >
              Pick the kinds of decisions you care about right now. We’ll use
              this later to tune your feed.
            </p>
          </div>

          {/* Lens grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              marginTop: 12,
              marginBottom: 22,
            }}
          >
            {LENSES.map((lens) => {
              const isActive = selected.includes(lens.id);
              return (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => toggleLens(lens.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: 20,
                    padding: 14,
                    cursor: "pointer",
                    border: isActive
                      ? `1px solid ${BLUE}`
                      : "1px solid rgba(11,35,67,0.08)",
                    background: isActive
                      ? "rgba(30,99,243,0.04)"
                      : "#ffffff",
                    boxShadow: isActive
                      ? "0 10px 24px rgba(30,99,243,0.15)"
                      : "0 6px 14px rgba(11,35,67,0.04)",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: NAVY,
                      }}
                    >
                      {lens.label}
                    </span>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isActive
                          ? `6px solid ${BLUE}`
                          : "2px solid rgba(11,35,67,0.25)",
                        background: isActive ? BLUE : "transparent",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(11, 35, 67, 0.75)",
                    }}
                  >
                    {lens.badge}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer / controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={!atLeastOne}
              onClick={() => {
                // For now just send them back home – we’ll wire real persistence later
                window.location.href = "/";
              }}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "12px 24px",
                fontWeight: 800,
                fontSize: 14,
                cursor: atLeastOne ? "pointer" : "not-allowed",
                opacity: atLeastOne ? 1 : 0.5,
                color: "#ffffff",
                background:
                  "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
                boxShadow: atLeastOne
                  ? "0 12px 26px rgba(11, 35, 67, 0.28)"
                  : "none",
              }}
            >
              Continue
            </button>

            <button
              type="button"
              onClick={() => {
                // Skip for now
                window.location.href = "/";
              }}
              style={{
                borderRadius: 999,
                padding: "11px 18px",
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid rgba(11,35,67,0.14)",
                background: "#ffffff",
                color: NAVY,
                cursor: "pointer",
              }}
            >
              Skip for now
            </button>

            <span
              style={{
                fontSize: 11,
                color: "rgba(11, 35, 67, 0.7)",
                marginLeft: "auto",
              }}
            >
              Picking at least one lens helps us show you better Quandr3s.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
