"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishSignIn() {
      // This forces Supabase to load the current session
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth callback error:", error.message);
      } else {
        console.log("Session:", data.session?.user?.email);
      }
      // Send them to home (or wherever you want)
      router.push("/");
    }

    finishSignIn();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "system-ui",
        background: "#ffffff",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>Signing you in…</h1>
      <p style={{ marginTop: 12, fontSize: 14 }}>One moment.</p>
    </main>
  );
}
