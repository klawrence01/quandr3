"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientButton from "@/app/components/ui/GradientButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

type Mode = "guest" | "member";

const LS_KEY_SIGNUP_STUB = "q3_signup_stub_v1";

export default function OnboardingResolvedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("guest");

  // Simple local check: did they complete the signup stub?
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY_SIGNUP_STUB);
      setMode(raw ? "member" : "guest");
    } catch {
      setMode("guest");
    }
  }, []);

  const isMember = mode === "member";

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
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 20px 56px",
        }}
      >
        {/* Header */}
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
            <div>
              <div
                style={{
                  fontWeight: 900,
                  letterSpacing: 0.3,
                  fontSize: 16,
                }}
              >
                QUANDR3
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                A people-powered clarity engine.
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              background: isMember
                ? "rgba(30,99,243,0.08)"
                : "rgba(0,169,165,0.08)",
              border: `1px solid ${
                isMember ? "rgba(30,99,243,0.5)" : "rgba(0,169,165,0.5)"
              }`,
              color: isMember ? BLUE : TEAL,
            }}
          >
            {isMember ? "Account active" : "Guest mode"}
          </span>
        </header>

        {/* Main card */}
        <section
          style={{
            borderRadius: 26,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 28,
            textAlign: "center",
          }}
        >
          {/* Check icon */}
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              boxShadow: "0 16px 44px rgba(11,35,67,0.3)",
            }}
          >
            <span
              style={{
                fontSize: 34,
                color: "#ffffff",
              }}
            >
              ✓
            </span>
          </div>

          <h1
            style={{
              marginTop: 0,
              marginBottom: 6,
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            You&apos;re in.
          </h1>

          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 15,
              color: "rgba(11,35,67,0.85)",
            }}
          >
            {isMember
              ? "Your account is live — you can follow people, post Quandr3s, and keep your activity synced across devices."
              : "You’re now in guest mode — you can explore, vote, and read reasoning. Create a free account anytime to follow people and post your own Quandr3s."}
          </p>

          {/* Capabilities */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 14,
              textAlign: "left",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(11,35,67,0.06)",
                background: "rgba(247,249,255,0.9)",
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                What you can do {isMember ? "right now" : "as a guest"}
              </div>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: 18,
                  margin: 0,
                  fontSize: 13,
                  color: "rgba(11,35,67,0.9)",
                }}
              >
                <li>View Quandr3s across categories</li>
                <li>Vote and instantly unlock reasoning</li>
                <li>See how different people think things through</li>
                {!isMember && (
                  <li>Warm up before you decide to create an account</li>
                )}
                {isMember && (
                  <li>Keep your activity tied to your profile</li>
                )}
              </ul>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(11,35,67,0.06)",
                background: "#ffffff",
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Why your setup matters
              </div>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: 18,
                  margin: 0,
                  fontSize: 13,
                  color: "rgba(11,35,67,0.9)",
                }}
              >
                <li>Your lenses help match you with the right voices.</li>
                <li>
                  Invite preferences help us highlight your posts to the people
                  you actually want to hear from.
                </li>
                <li>
                  Interests help your feed feel tailored from day one instead of
                  random.
                </li>
              </ul>
            </div>
          </div>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <GradientButton onClick={() => router.push("/dashboard")}>
              Go to your dashboard
            </GradientButton>

            {isMember ? (
              <button
                type="button"
                onClick={() => router.push("/create")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(11,35,67,0.16)",
                  background: "#ffffff",
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                Post your first Quandr3
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/signup")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(11,35,67,0.16)",
                  background: "#ffffff",
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                Create a free account
              </button>
            )}

            <span
              style={{
                fontSize: 11,
                color: "rgba(11,35,67,0.75)",
                marginTop: 4,
              }}
            >
              V1 note: Everything is still local-only on this device while we
              wire up real auth and sync.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
