// /app/login/LoginClient.tsx
"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

const COOLDOWN_SECONDS = 60;

export default function LoginClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);

  const next = useMemo(() => safeStr(sp.get("next")) || "/explore", [sp]);

  // Save referral if present
  useEffect(() => {
    const ref = safeStr(sp.get("ref"));
    if (isUuid(ref) && typeof window !== "undefined") {
      localStorage.setItem("q_referrer", ref);
      sessionStorage.setItem("q_referrer", ref);
    }
  }, [sp]);

  // Restore cooldown from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("q_magic_link_last_sent_at");
      const ts = raw ? Number(raw) : 0;
      if (!ts) return;

      const diff = Math.floor((Date.now() - ts) / 1000);
      const left = Math.max(0, COOLDOWN_SECONDS - diff);
      if (left > 0) setCooldownLeft(left);
    } catch {}
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  // If already logged in, redirect immediately
  useEffect(() => {
    let alive = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!alive) return;

        if (session?.user) {
          router.replace(next);
          return;
        }
      } catch {}
      if (alive) setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace(next);
      }
    });

    return () => {
      alive = false;
      subscription?.unsubscribe?.();
    };
  }, [router, next]);

  async function sendLink() {
    setNote("");

    const e = safeStr(email).toLowerCase();
    if (!e.includes("@")) {
      setNote("Enter a valid email.");
      return;
    }

    if (cooldownLeft > 0) {
      setNote(`Please wait ${cooldownLeft}s before requesting another magic link.`);
      return;
    }

    setBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const storedRef =
        (typeof window !== "undefined" &&
          (localStorage.getItem("q_referrer") ||
            sessionStorage.getItem("q_referrer"))) ||
        "";

      const emailRedirectTo =
        `${origin}/auth/callback?next=${encodeURIComponent(next)}` +
        (isUuid(storedRef) ? `&ref=${encodeURIComponent(storedRef)}` : "");

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      if (typeof window !== "undefined") {
        localStorage.setItem("q_magic_link_last_sent_at", String(Date.now()));
        localStorage.setItem("q_last_login_email", e);
      }

      setCooldownLeft(COOLDOWN_SECONDS);
      setNote("Magic link sent. Check your inbox and spam folder. Open it in this same browser.");
    } catch (err: any) {
      const msg = safeStr(err?.message).toLowerCase();

      if (msg.includes("rate limit")) {
        setNote(
          "Email rate limit exceeded. Stop retrying for now and wait before requesting another link."
        );
      } else {
        setNote(err?.message || "Could not send magic link.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 1000, marginBottom: 8 }}>Log in</h1>
        <div style={{ color: "#5f7896", fontWeight: 800 }}>Checking session…</div>
      </div>
    );
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
        autoComplete="email"
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
            background: note.toLowerCase().includes("sent") ? "#ecfff7" : "#fff1f1",
            border: note.toLowerCase().includes("sent")
              ? "1px solid #b7f1d7"
              : "1px solid #ffd0d0",
            color: note.toLowerCase().includes("sent") ? "#0a6b4f" : "#8b1e1e",
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          {note}
        </div>
      ) : null}

      {cooldownLeft > 0 ? (
        <div
          style={{
            marginBottom: 12,
            color: "#5f7896",
            fontWeight: 800,
          }}
        >
          Please wait {cooldownLeft}s before requesting another link.
        </div>
      ) : null}

      <button
        onClick={sendLink}
        disabled={busy || cooldownLeft > 0}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 16,
          border: "2px solid #0c223c",
          background: busy || cooldownLeft > 0 ? "#e5ecfb" : "#1e63f3",
          color: busy || cooldownLeft > 0 ? "#0b2343" : "white",
          fontWeight: 1000,
          cursor: busy || cooldownLeft > 0 ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Sending…" : cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : "Send magic link"}
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