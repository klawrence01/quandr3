// /app/auth/callback/page.tsx
"use client";
// @ts-nocheck

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const SOFT_BG = "#f5f7fc";

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const [msg, setMsg] = useState("Signing you in…");
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Optional redirect target: /auth/callback?next=/explore
        const next = sp.get("next") || "/explore";

        // PKCE flow: /auth/callback?code=...
        const code = sp.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Magic link / hash flow fallback
          // (If nothing to exchange, this safely no-ops)
          try {
            const { error } = await supabase.auth.getSession();
            if (error) throw error;
          } catch {}
        }

        if (!alive) return;

        setMsg("Success. Redirecting…");
        router.replace(next);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Could not complete sign-in.");
        setMsg("Sign-in failed.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, sp]);

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 16px" }}>
        <div
          style={{
            background: "white",
            border: "2px solid #0c223c",
            borderRadius: 26,
            padding: 22,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 1000, color: NAVY }}>
            Auth Callback
          </div>
          <div style={{ marginTop: 10, fontWeight: 900, color: "#2b405b" }}>
            {msg}
          </div>

          {err ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 16,
                background: "#fff1f1",
                border: "1px solid #ffd0d0",
                color: "#8b1e1e",
                fontWeight: 900,
              }}
            >
              {err}
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <Link
              href="/explore"
              style={{
                color: NAVY,
                fontWeight: 1000,
                textDecoration: "none",
              }}
            >
              ← Go to Explore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  // ✅ Fix: useSearchParams must be inside a Suspense boundary
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}