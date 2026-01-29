"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type ScopeFilter = "global" | "local";
type StatusFilter = "all" | "open" | "awaiting_user" | "resolved";

type Category = {
  key: string;
  label: string;
  sponsored?: boolean;
};

const ALL_CATEGORIES: Category[] = [
  { key: "all", label: "All" },
  { key: "money", label: "Money", sponsored: true },
  { key: "style", label: "Style (Clothing)", sponsored: true },
  { key: "relationships", label: "Relationships", sponsored: true },
  { key: "career", label: "Career" },
  { key: "health", label: "Health" },
  { key: "parenting", label: "Parenting" },
  { key: "food", label: "Food & Drink" },
];

function pillStyle(active: boolean) {
  return {
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? BLUE : "rgba(0,0,0,0.12)"}`,
    background: active ? "rgba(30,99,243,0.10)" : "white",
    color: active ? NAVY : "#111",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  } as const;
}

export default function ExploreClient({
  initialCategory,
  initialStatus,
  initialScope,
}: {
  initialCategory: string;
  initialStatus: string;
  initialScope: string;
}) {
  const [user, setUser] = useState<any>(null);

  const [category, setCategory] = useState<string>(initialCategory ?? "all");
  const [status, setStatus] = useState<StatusFilter>(
    (initialStatus as StatusFilter) ?? "all"
  );
  const [scope, setScope] = useState<ScopeFilter>(
    (initialScope as ScopeFilter) ?? "global"
  );

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  async function load() {
    setLoading(true);

    // Pull basic quandr3 rows (keep it simple + Vercel safe)
    const { data, error } = await supabase
      .from("quandr3s")
      .select(
        "id,title,category,created_at,author_id,status,voting_duration_hours,voting_max_votes,discussion_open"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = rows;

    if (category !== "all") {
      list = list.filter((q) => String(q.category || "").toLowerCase() === category);
    }

    if (status !== "all") {
      list = list.filter((q) => q.status === status);
    }

    // scope is here for Phase 1 UI (we’re not enforcing geo yet)
    if (scope === "local") {
      // If you later add q.scope, filter it here
    }

    return list;
  }, [rows, category, status, scope]);

  return (
    <div style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        {/* Top */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, color: NAVY }}>Explore</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/q/create">Create Quandr3</Link>
            <Link href="/account">{user ? "Account" : "Log in"}</Link>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 16,
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={pillStyle(category === c.key)}
                title={c.sponsored ? "Sponsored category" : ""}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="awaiting_user">Awaiting User</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>Scope</div>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as ScopeFilter)}
                style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <option value="global">Global</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "#666" }}>No Quandr3s yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((q) => (
                <Link
                  key={q.id}
                  href={`/q/${q.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "white",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900, color: NAVY }}>{q.title}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{q.category}</div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                    Status: <strong>{q.status}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
