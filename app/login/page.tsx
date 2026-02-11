// app/login/page.tsx
"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const n = safeStr(searchParams?.get("next"));
    return n || "/explore";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // If already logged in, bounce
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (data?.user) router.replace(nextPath);
    })();
    return () => {
      alive = false;
    };
  }, [router, nextPath]);

  async function sendMagicLink(e: any) {
    e?.preventDefault?.();
    setErr("");
    setMsg("");

    const e1 = safeStr(email).toLowerCase();
    if (!e1 || !e1.includes("@")) {
      setErr("Enter a valid email.");
      return;
    }

    try {
      setSending(true);

      // IMPORTANT: redirectTo must match a URL allowed in Supabase Auth settings
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              nextPath
            )}`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: e1,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMsg("✅ Check your email for a sign-in link (magic link).");
    } catch (ex: any) {
      setErr(safeStr(ex?.message) || "Could not send the magic link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(180deg, ${SOFT_BG}, #fff)` }}
    >
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-xs font-semibold tracking-[0.22em] text-slate-500">
            QUANDR3
          </div>
          <h1 className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
            Log in with Magic Link
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            No password needed. We’ll email you a secure sign-in link.
          </p>
        </div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2"
              style={{ borderColor: "rgba(15,23,42,0.12)" }}
              autoComplete="email"
            />
          </label>

          {err ? (
            <div className="rounded-2xl border px-4 py-3 text-sm"
                 style={{ borderColor: "rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: NAVY }}>
              {err}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-2xl border px-4 py-3 text-sm"
                 style={{ borderColor: "rgba(0,169,165,0.35)", background: "rgba(0,169,165,0.08)", color: NAVY }}>
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-full px-5 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
            style={{
              background:
                "linear-gradient(90deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
            }}
          >
            {sending ? "Sending…" : "Send Magic Link"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <Link href="/explore" className="font-semibold" style={{ color: BLUE }}>
            ← Back to Explore
          </Link>
          <Link href="/signup" className="font-semibold" style={{ color: BLUE }}>
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
