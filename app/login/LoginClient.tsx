"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = useMemo(() => sp?.get("next") || "/explore", [sp]);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSendLink(e: any) {
    e.preventDefault();
    setMsg(null);

    const clean = (email || "").trim();
    if (!clean) {
      setMsg("Enter your email first.");
      return;
    }

    setSending(true);
    try {
      // OTP / Magic Link
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
              : undefined,
        },
      });

      if (error) {
        setMsg(error.message || "Could not send link.");
        setSending(false);
        return;
      }

      setSent(true);
      setMsg("✅ Magic link sent. Check your inbox (and spam).");
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${SOFT_BG}, #fff)` }}>
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-[28px] border bg-white p-7 shadow-sm" style={{ borderColor: "rgba(15,23,42,0.12)" }}>
          <div className="mb-2 text-xs font-semibold tracking-widest text-slate-500">QUANDR3</div>
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>
            Log in
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We’ll email you a secure magic link. No password needed.
          </p>

          <form onSubmit={handleSendLink} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              />
            </div>

            {msg ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: sent ? "rgba(0,169,165,0.35)" : "rgba(255,107,107,0.35)",
                  background: sent ? "rgba(0,169,165,0.08)" : "rgba(255,107,107,0.08)",
                  color: sent ? TEAL : "#b91c1c",
                }}
              >
                {msg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
              style={{
                background: `linear-gradient(90deg, ${BLUE} 0%, ${TEAL} 55%, ${CORAL} 100%)`,
              }}
            >
              {sending ? "Sending…" : "Send magic link"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/explore" className="font-semibold" style={{ color: BLUE }}>
                ← Back to Explore
              </Link>
              <Link href="/signup" className="font-semibold" style={{ color: NAVY }}>
                Need an account? Sign up
              </Link>
            </div>

            <div className="pt-2 text-xs text-slate-500">
              After clicking the link, you’ll return to: <span className="font-mono">{nextPath}</span>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
