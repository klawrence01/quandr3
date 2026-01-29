"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

export default function SupabaseTestPage() {
  const [data, setData] = useState<Quandr3Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("quandr3s")
        .select("id, title, category, status, created_at")
        .limit(10);

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setData(data || []);
      }
    }

    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Supabase Test
      </h1>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#ffe5e5",
            marginBottom: 16,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {!error && !data && <p>Loading…</p>}

      {data && data.length === 0 && <p>No Quandr3s found yet.</p>}

      {data && data.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 16,
            border: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
