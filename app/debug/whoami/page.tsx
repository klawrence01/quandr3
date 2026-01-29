"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

export default function WhoAmIPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    }
    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "system-ui",
        background: "#ffffff",
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Who am I?</h1>
      {email ? (
        <p style={{ marginTop: 12 }}>Logged in as: {email}</p>
      ) : (
        <p style={{ marginTop: 12 }}>
          Not logged in. Go to <code>/auth/login</code>.
        </p>
      )}
    </main>
  );
}
