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
        const next = sp.get("next") || "/explore";
        const code = sp.get("code");
        const token_hash = sp.get("token_hash");
        const type = sp.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          });
          if (error) throw error;
        } else {
          const hash = window.location.hash || "";
          const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
          } else {
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error) throw error;
            if (!session) {
              throw new Error("No auth session was created from the callback.");
            }
          }
        }

        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();

        if (sessionErr) throw sessionErr;
        if (!session) throw new Error("Sign-in completed, but no session is available.");

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
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}