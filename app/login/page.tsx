
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

const LS_KEY_SIGNUP_STUB = "q3_signup_stub_v1";

type SignupStub = {
  displayName: string;
  email: string;
  createdAtISO: string;
  lastLoginISO?: string;
};

function loadStub(): SignupStub | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY_SIGNUP_STUB);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStub(data: SignupStub) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY_SIGNUP_STUB, JSON.stringify(data));
}

/* Small UI bits reused */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(30,99,243,0.3)",
        background: "rgba(30,99,243,0.06)",
        fontSize: 12,
        letterSpacing: 0.2,
        color: BLUE,
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

export default function LoginPage() {
  const router = useRouter();
  const existing = typeof window !== "undefined" ? loadStub() : null;

  const [email, setEmail] = useState(existing?.email ?? "");
  const [remember, setRemember] = useState(true);

  const canSubmit = useMemo(() => {
    const e = email.trim().toLowerCase();
    return e.includes("@") && e.includes(".");
  }, [email]);

  const shellStyle: React.CSSProperties = {
    minHeight: "100vh",
    color: NAVY,
    background: SOFT_BG,
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 640,
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
            <Pill>Welcome back</Pill>
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
              marginBottom: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 30,
                  margin: 0,
                  fontWeight: 950,
                  color: NAVY,
                }}
              >
                Log in
              </h1>
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  opacity: 0.9,
                  lineHeight: 1.6,
                  fontSize: 15,
                  maxWidth: 380,
                }}
              >
                Jump back into your feed, profiles, and saved Quandr3s.
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push("/signup")}>
              Create account
            </Button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;

              const trimmedEmail = email.trim().toLowerCase();

              const base: SignupStub =
                existing && existing.email === trimmedEmail
                  ? existing
                  : {
                      displayName: existing?.displayName || "Guest",
                      email: trimmedEmail,
                      createdAtISO:
                        existing?.createdAtISO ||
                        new Date().toISOString(),
                    };

              saveStub({
                ...base,
                lastLoginISO: new Date().toISOString(),
              });

              // Local-only "login" — for now go to onboarding lenses
              router.push("/onboarding/step1");
            }}
            style={{ display: "grid", gap: 12, marginTop: 8 }}
          >
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
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ transform: "scale(1.1)" }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.4, color: NAVY }}>
                Remember me on this device.
              </span>
            </label>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <Button type="submit" disabled={!canSubmit}>
                Log in
              </Button>
              <Button
                variant="ghost"
                onClick={() => alert("Stub: Google sign-in coming later.")}
              >
                Continue with Google (later)
              </Button>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  fontSize: 13,
                  color: BLUE,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            </div>

            <div
              style={{
                opacity: 0.8,
                fontSize: 12,
                marginTop: 8,
                color: "rgba(11,35,67,0.85)",
              }}
            >
              V1 note: This login is local-only. Real auth goes live when we
              wire Supabase.
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
