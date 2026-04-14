"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

/* ---------- constants ---------- */

const NAVY = "#0b2343";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";
const PENDING_PROFILE_KEY = "q3_pending_profile";

/* ---------- INNER PAGE (real logic) ---------- */

function SignupPageInner() {
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
    return (
      e.includes("@") &&
      displayName.length >= 2 &&
      password.length >= 6 &&
      city.length >= 2 &&
      state.length >= 2 &&
      agree
    );
  }, [displayName, email, password, city, state, agree]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const user = data?.user;
      if (!user) return;

      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          email,
          display_name: displayName,
          city,
          state,
          referred_by: referrer || null,
        })
      );

      alert("Account created. Please log in.");
      router.push("/login?completeProfile=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG, padding: 20 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: NAVY }}>
          Create your account
        </h1>

        {referrer && (
          <div style={{ marginTop: 10, color: CORAL, fontWeight: 700 }}>
            Referral detected
          </div>
        )}

        <form onSubmit={handleSignup} style={{ marginTop: 20 }}>
          <input
            placeholder="Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <input
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            Agree to be respectful
          </label>

          <button disabled={!canSubmit || loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ---------- OUTER WRAPPER (FIX) ---------- */

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading signup...</div>}>
      <SignupPageInner />
    </Suspense>
  );
}