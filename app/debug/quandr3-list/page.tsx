"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type QRow = {
  id: string;
  title: string;
  category: string;
  created_at: string;
};

export default function Quandr3ListDebugPage() {
  const [items, setItems] = useState<QRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("quandr3s")
        .select("id, title, category, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setItems(data || []);
      }
    }

    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
        Debug: Quandr3 List
      </h1>
      <p style={{ fontSize: 14, color: "#444", marginBottom: 20 }}>
        These are real Quandr3s from Supabase. Click one to vote.
      </p>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#ffe5e5",
            marginBottom: 16,
          }}
        >
          Error: {error}
        </div>
      )}

      {items.length === 0 && !error && <p>No Quandr3s yet.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((q) => (
          <Link key={q.id} href={`/debug/vote/${q.id}`}>
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid #e1e4ff",
                background: "#f7f8ff",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#1e63f3",
                  marginBottom: 4,
                }}
              >
                {q.category}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                {q.title}
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>
                Created: {new Date(q.created_at).toLocaleString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
