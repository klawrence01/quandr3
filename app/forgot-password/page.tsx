"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const SOFT_BG = "#f7f9ff";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const canSubmit = email.trim().includes("@") && email.includes(".");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        color: NAVY,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 18px" }}>
        {/* Header */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(11,35,67,0.12)",
            background: "#ffffff",
            padding: "6px 14px",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          ← Back
        </button>

        <section
          style={{
            borderRadius: 22,
            background: "#ffffff",
            border: "1px solid rgba(11,35,67,0.08)",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 22,
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: 6,
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            Forgot your password?
          </h1>
          <p
            style={{
              marginTop: 0,
              marginBottom: 14,
              fontSize: 15,
              color: "rgba(11,35,67,0.85)",
            }}
          >
            Quandr3 V1 uses a local-only account stub. There&apos;s nothing
            stored on our servers yet, so there&apos;s no real password to
            reset. This screen is here so the flow feels complete while we get
            Supabase/Auth wired up.
          </p>

          <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              style={{
                padding: "11px 13px",
                borderRadius: 14,
                border: "1px solid rgba(30,99,243,0.25)",
                background: "#ffffff",
                color: NAVY,
                fontSize: 14,
              }}
            />
          </label>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              alert(
                "Stub only: once real auth is live, this will email you a reset link."
              )
            }
            style={{
              border: "none",
              borderRadius: 999,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 850,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.5,
              background:
                "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
              color: "#ffffff",
              boxShadow: canSubmit
                ? "0 14px 34px rgba(11,35,67,0.28)"
                : "none",
            }}
          >
            Send reset link (later)
          </button>

          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "rgba(11,35,67,0.8)",
            }}
          >
            For now, if you&apos;re stuck, you can always{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              style={{
                border: "none",
                background: "transparent",
                color: BLUE,
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
              }}
            >
              create a fresh free account
            </button>{" "}
            while we finish wiring secure auth.
          </p>
        </section>
      </div>
    </main>
  );
}
