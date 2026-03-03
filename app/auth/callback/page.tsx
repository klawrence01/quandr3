// /app/auth/callback/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const SOFT_BG = "#f5f7fc";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Supabase will read the URL hash/query and finalize the session client-side.
        // We don’t need to do much here besides wait a moment and then route away.
        await supabase.auth.getSession();
      } catch (e) {
        // fail soft
      } finally {
        if (!alive) return;
        router.replace("/explore");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "white",
          border: "2px solid #0c223c",
          borderRadius: 22,
          padding: 22,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 1100, color: NAVY }}>
          Signing you in…
        </div>
        <div style={{ marginTop: 10, fontWeight: 800, color: "#2b405b" }}>
          One moment. Redirecting you now.
        </div>
      </div>
    </div>
  );
}