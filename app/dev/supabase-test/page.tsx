"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    (async () => {
      try {
        // If env vars are correct, this will succeed
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("Supabase error: " + error.message);
          return;
        }

        setStatus(
          "Supabase client OK ✅ (session: " +
            (data?.session ? "present" : "none") +
            ")"
        );
      } catch (err: any) {
        console.error(err);
        setStatus("Error: " + (err?.message ?? "unknown"));
      }
    })();
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>Supabase Connection Test</h1>
      <p>{status}</p>
      <p style={{ opacity: 0.7, fontSize: 12 }}>
        If this says “Supabase client OK ✅”, your environment variables are loading.
      </p>
    </main>
  );
}
