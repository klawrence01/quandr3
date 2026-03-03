// /app/login/LoginClient.tsx
"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function isUuid(s?: string) {
  const v = safeStr(s);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function LoginClient() {
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  // ✅ capture ?ref=... and store for callback to apply to profiles.referred_by
  useEffect(() => {
    const ref = safeStr(sp.get("ref"));
    if (isUuid(ref)) {
      localStorage.setItem("q_referrer", ref);
      sessionStorage.setItem("q_referrer", ref);
    }
  }, [sp]);

  const next = useMemo(() => safeStr(sp.get("next")) || "/explore", [sp]);

  async function sendLink() {
    setNote("");
    const e = safeStr(email).toLowerCase();
    if (!e.includes("@")) {
      setNote("Enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      // ✅ Pull referrer from storage (captured above) and include it in callback URL
      const storedRef =
        (typeof window !== "undefined" &&
          (localStorage.getItem("q_referrer") ||
            sessionStorage.getItem("q_referrer"))) ||
        "";

      // ✅ IMPORTANT: redirect into /auth/callback so we exchange the code for session
      const emailRedirectTo =
        `${origin}/auth/callback?next=${encodeURIComponent(next)}` +
        (isUuid(storedRef) ? `&ref=${encodeURIComponent(storedRef)}` : "");

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      setNote("Magic link sent. Check your inbox (and spam).");
    } catch (err: any) {
      setNote(err?.message || "Could not send magic link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, fontWeight: 1000, marginBottom: 8 }}>
        Log in
      </h1>
      <div style={{ color: "#5f7896", fontWeight: 800, marginBottom: 16 }}>
        We’ll email you a secure magic link. No password needed.
      </div>

      <div style={{ fontWeight: 900, marginBottom: 8 }}>Email</div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{
          width: "100%",
          padding: "14px 14px",
          borderRadius: 14,
          border: "2px solid #e5ecfb",
          outline: "none",
          fontWeight: 900,
          marginBottom: 12,
        }}
      />

      {note ? (
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: note.includes("sent") ? "#ecfff7" : "#fff1f1",
            border: note.includes("sent")
              ? "1px solid #b7f1d7"
              : "1px solid #ffd0d0",
            color: note.includes("sent") ? "#0a6b4f" : "#8b1e1e",
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          {note}
        </div>
      ) : null}

      <button
        onClick={sendLink}
        disabled={busy}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 16,
          border: "2px solid #0c223c",
          background: busy ? "#e5ecfb" : "#1e63f3",
          color: busy ? "#0b2343" : "white",
          fontWeight: 1000,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Sending…" : "Send magic link"}
      </button>

      <div style={{ marginTop: 16 }}>
        <Link
          href="/explore"
          style={{ fontWeight: 900, textDecoration: "none" }}
        >
          ← Back to Explore
        </Link>
      </div>

      <div style={{ marginTop: 10, color: "#5f7896", fontWeight: 800 }}>
        After clicking the link, you’ll return to: <b>{next}</b>
      </div>
    </div>
  );
}