"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SignupStub = {
  displayName: string;
  email: string;
  createdAtISO: string;
};

const LS_KEY_SIGNUP_STUB = "q3_signup_stub_v1";

function saveSignupStub(data: SignupStub) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY_SIGNUP_STUB, JSON.stringify(data));
}

/* ---------- Design tokens ---------- */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

/* ---------- Small UI pieces ---------- */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(255,107,107,0.08)",
        fontSize: 12,
        letterSpacing: 0.2,
        color: CORAL,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const isGhost = variant === "ghost";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "11px 14px",
        borderRadius: 999,
        border: isGhost
          ? "1px solid rgba(11,35,67,0.16)"
          : "1px solid rgba(30,99,243,0.6)",
        background: isGhost
          ? "#ffffff"
          : "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
        color: isGhost ? NAVY : "#ffffff",
        fontWeight: 850,
        letterSpacing: 0.2,
        opacity: disabled ? 0.55 : 1,
        boxShadow: isGhost
          ? "0 4px 10px rgba(11,35,67,0.08)"
          : "0 14px 34px rgba(11,35,67,0.28)",
        transition: "transform 120ms ease, filter 120ms ease, box-shadow 120ms",
        filter: disabled ? "none" : "saturate(1.02)",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.985)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          fontSize: 13,
          opacity: 0.9,
          fontWeight: 800,
          color: NAVY,
        }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={{
          width: "100%",
          padding: "11px 13px",
          borderRadius: 14,
          border: "1px solid rgba(30,99,243,0.25)",
          background: "#ffffff",
          color: NAVY,
          outline: "none",
          fontSize: 14,
          boxShadow: "0 4px 10px rgba(11,35,67,0.04)",
        }}
      />
    </label>
  );
}

/* ---------- Page ---------- */

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);

  const canSubmit = useMemo(() => {
    const e = email.trim().toLowerCase();
    const hasEmail = e.includes("@") && e.includes(".");
    const hasName = displayName.trim().length >= 2;
    return hasEmail && hasName && agree;
  }, [displayName, email, agree]);

  const shellStyle: React.CSSProperties = {
    minHeight: "100vh",
    color: NAVY,
    background: SOFT_BG,
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
    padding: "22px",
    borderRadius: 22,
    border: "1px solid rgba(11,35,67,0.08)",
    background: "#ffffff",
    boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
  };

  return (
    <main style={shellStyle}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "26px 18px" }}>
        {/* Top Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #1e63f3 0%, #ff6b6b 50%, #00a9a5 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 10px 26px rgba(11,35,67,0.28)",
              }}
            >
              <img
                src="/assets/logo/quandr3-logo.png"
                alt="Quandr3"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: "#ffffff",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 950,
                  letterSpacing: 0.2,
                  fontSize: 16,
                }}
              >
                QUANDR3
              </div>
              <div style={{ fontSize: 12, opacity: 0.82 }}>
                Ask. Share. Decide.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill>Free account</Pill>
          </div>
        </div>

        {/* Main Card */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 32,
                  margin: 0,
                  fontWeight: 950,
                  color: NAVY,
                }}
              >
                Create your account
              </h1>
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  opacity: 0.9,
                  lineHeight: 1.6,
                  fontSize: 15,
                  maxWidth: 420,
                }}
              >
                Unlock profiles, following, reactions, and posting — and keep
                your activity synced across devices.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <Button variant="ghost" onClick={() => router.push("/onboarding")}>
                Back
              </Button>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 18,
              background: "rgba(30,99,243,0.04)",
              border: "1px solid rgba(30,99,243,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                opacity: 0.9,
                fontWeight: 850,
                marginBottom: 4,
                color: NAVY,
              }}
            >
              Quick setup (V1 stub)
            </div>
            <div
              style={{
                fontSize: 13,
                opacity: 0.85,
                lineHeight: 1.5,
                color: "rgba(11,35,67,0.9)",
              }}
            >
              This is a local-first scaffold — we’ll wire Supabase/Auth later.
              Submitting stores a tiny signup stub on this device so the flow
              feels real from day one.
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;

              saveSignupStub({
                displayName: displayName.trim(),
                email: email.trim().toLowerCase(),
                createdAtISO: new Date().toISOString(),
              });

              // For now, send new users into onboarding step 1 (later: feed/home).
              router.push("/onboarding/step1");
            }}
            style={{ marginTop: 16, display: "grid", gap: 12 }}
          >
            <Field
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="e.g., CuriosoKen"
            />
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
            />

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                opacity: 0.95,
                marginTop: 2,
              }}
            >
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.4, color: NAVY }}>
                I agree to be respectful and keep the reasoning real.
              </span>
            </label>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              <Button type="submit" disabled={!canSubmit}>
                Create free account
              </Button>
              <Button
                variant="ghost"
                onClick={() => alert("Stub: Google sign-in coming later.")}
              >
                Continue with Google (later)
              </Button>
              <Button variant="ghost" onClick={() => router.push("/login")}>
                I already have an account
              </Button>
            </div>

            <div
              style={{
                opacity: 0.8,
                fontSize: 12,
                marginTop: 8,
                color: "rgba(11,35,67,0.85)",
              }}
            >
              V1 note: This page is intentionally local-first. No server, no
              database, no real auth yet — just a clean path ready to plug in.
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
