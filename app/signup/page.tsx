"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

/* ---------- Design tokens ---------- */

const NAVY = "#0b2343";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";
const PENDING_PROFILE_KEY = "q3_pending_profile";

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
  const searchParams = useSearchParams();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [agree, setAgree] = useState(false);
  const [referrer, setReferrer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref") || "";
    setReferrer(ref);
  }, [searchParams]);

  const canSubmit = useMemo(() => {
    const e = email.trim().toLowerCase();
    const hasEmail = e.includes("@") && e.includes(".");
    const hasName = displayName.trim().length >= 2;
    const hasPassword = password.trim().length >= 6;
    const hasCity = city.trim().length >= 2;
    const hasState = state.trim().length >= 2;
    return hasEmail && hasName && hasPassword && hasCity && hasState && agree;
  }, [displayName, email, password, city, state, agree]);

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const user = data?.user;

      if (!user) {
        alert("Account created, but no user was returned.");
        return;
      }

      // Save extra profile details locally so we can apply them AFTER login
      // when the session is fully active and RLS won't fight us.
      if (typeof window !== "undefined") {
        localStorage.setItem(
          PENDING_PROFILE_KEY,
          JSON.stringify({
            email: cleanEmail,
            display_name: displayName.trim(),
            city: city.trim(),
            state: state.trim(),
            referred_by: referrer || null,
            created_at: new Date().toISOString(),
          })
        );
      }

      alert("Account created. Please log in to finish setup.");
      router.push("/login?completeProfile=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "26px 18px" }}>
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

          {referrer ? (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 18,
                background: "rgba(0,169,165,0.08)",
                border: "1px solid rgba(0,169,165,0.24)",
                fontSize: 13,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              Referral detected
            </div>
          ) : null}

          <form
            onSubmit={handleSignup}
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

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
              type="password"
            />

            <Field
              label="City"
              value={city}
              onChange={setCity}
              placeholder="e.g., Providence"
            />

            <Field
              label="State"
              value={state}
              onChange={setState}
              placeholder="e.g., RI"
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
              <Button type="submit" disabled={!canSubmit || loading}>
                {loading ? "Creating..." : "Create free account"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => alert("Google sign-in coming later.")}
              >
                Continue with Google (later)
              </Button>

              <Button variant="ghost" onClick={() => router.push("/login")}>
                I already have an account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}