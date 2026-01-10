"use client";

import React from "react";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
// very light blue, not gray
const SOFT_BG = "#f7f9ff";

export default function OnboardingPage() {
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
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 20px 40px",
        }}
      >
        {/* Top bar (no global nav – onboarding is its own space) */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Logo + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, #1e63f3 0%, #1e63f3 33%, #ff6b6b 33%, #ff6b6b 66%, #00a9a5 66%, #00a9a5 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 8px 20px rgba(11, 35, 67, 0.25)",
              }}
            >
              {/* uses the new logo asset */}
              <img
                src="/assets/logo/quandr3-logo.png"
                alt="Quandr3"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "#ffffff",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  fontSize: 18,
                }}
              >
                QUANDR3
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.85,
                  color: "rgba(11, 35, 67, 0.8)",
                }}
              >
                A people-powered clarity engine.
              </div>
            </div>
          </div>

          {/* Mode + category pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Pill tone="teal" label="Guest mode" />
            <Pill tone="coral" label="Category: Money" />
          </div>
        </header>

        {/* Main card */}
        <section
          style={{
            borderRadius: 26,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11, 35, 67, 0.12)",
            padding: 24,
          }}
        >
          {/* Headline */}
          <div style={{ marginBottom: 20 }}>
            <h1
              style={{
                fontSize: 40,
                lineHeight: 1.1,
                margin: 0,
                fontWeight: 900,
                color: NAVY,
              }}
            >
              Get unstuck.
            </h1>
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 17,
                maxWidth: 640,
                color: "rgba(11, 35, 67, 0.78)",
              }}
            >
              See how real people think through real decisions — then decide
              what feels right for you.
            </p>
          </div>

          {/* Today’s Quandr3 banner */}
          <div
            style={{
              borderRadius: 20,
              padding: "14px 18px",
              marginBottom: 24,
              background:
                "linear-gradient(135deg, rgba(30,99,243,0.08), rgba(0,169,165,0.08))",
              border: "1px solid rgba(30,99,243,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: BLUE,
                }}
              >
                Today’s Quandr3
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(255,107,107,0.08)",
                  color: CORAL,
                  border: `1px solid rgba(255,107,107,0.45)`,
                }}
              >
                Money • Starter demo
              </span>
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 4,
                color: NAVY,
              }}
            >
              I just got a $5,000 bonus. What’s the smartest move right now?
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(11, 35, 67, 0.75)",
              }}
            >
              Pick <strong>A</strong>, <strong>B</strong>, or <strong>C</strong>
              . Results unlock after you vote.
            </div>
          </div>

          {/* Three tiles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 16,
              marginBottom: 22,
            }}
          >
            <InfoTile
              title="No account needed"
              body="Try your first Quandr3 instantly. We’ll keep your choices on this device until you decide to create an account."
            />
            <InfoTile
              title="Reasoning matters"
              body="Two people can make the same choice for different reasons. Here, the ‘why’ lives right next to the vote."
            />
            <InfoTile
              title="Profiles are protected"
              body="Guests can scroll the feed, but need a free account to follow people or visit someone’s full profile."
            />
          </div>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: "14px 26px",
                fontWeight: 800,
                fontSize: 15,
                color: "#ffffff",
                background:
                  "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
                boxShadow: "0 14px 30px rgba(11, 35, 67, 0.3)",
              }}
              onClick={() => {
                // local-only: route to step 1 when we wire it
                window.location.href = "/onboarding/step1";
              }}
            >
              Try your first Quandr3
            </button>

            <button
              type="button"
              style={{
                borderRadius: 999,
                padding: "14px 20px",
                fontWeight: 700,
                fontSize: 14,
                border: "1px solid rgba(11,35,67,0.12)",
                background: "#ffffff",
                color: NAVY,
                cursor: "pointer",
              }}
              onClick={() => {
                alert(
                  "Guest mode keeps things simple. Following and profiles unlock when you create a free account."
                );
              }}
            >
              Why can’t I follow?
            </button>

            <div
              style={{
                fontSize: 11,
                color: "rgba(11, 35, 67, 0.7)",
                marginLeft: "auto",
              }}
            >
              Guest activity is saved locally on this device (for now).
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- Small UI pieces ---------- */

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "teal" | "coral";
}) {
  const bg =
    tone === "teal" ? "rgba(0,169,165,0.08)" : "rgba(255,107,107,0.08)";
  const border =
    tone === "teal" ? "rgba(0,169,165,0.4)" : "rgba(255,107,107,0.45)";
  const color = tone === "teal" ? TEAL : CORAL;

  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        background: bg,
        border: `1px solid ${border}`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function InfoTile({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(11,35,67,0.06)",
        background: "#ffffff",
        boxShadow: "0 6px 14px rgba(11,35,67,0.05)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          marginBottom: 6,
          fontSize: 15,
          color: NAVY,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "rgba(11, 35, 67, 0.8)",
        }}
      >
        {body}
      </div>
    </div>
  );
}
