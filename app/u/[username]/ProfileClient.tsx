// app/u/[username]/ProfileClient.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

const NAVY = "#0b2343";
const BLUE = "#1e63f3";

export default function ProfileClient({ handle }: { handle: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quandr3s, setQuandr3s] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      if (!handle) {
        setMessage("Missing username.");
        setLoading(false);
        return;
      }

      // 1) Find profile by username
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .eq("username", handle)
        .single();

      if (pErr || !prof) {
        console.error(pErr);
        setMessage("We couldn’t find that user.");
        setLoading(false);
        return;
      }

      setProfile(prof as Profile);

      // 2) Load this user’s Quandr3s
      const { data: qs, error: qErr } = await supabase
        .from("quandr3s")
        .select("id, title, category, status, created_at")
        .eq("user_id", prof.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (qErr) {
        console.error(qErr);
        setMessage(qErr.message);
        setLoading(false);
        return;
      }

      setQuandr3s(qs || []);
      setLoading(false);
    }

    load();
  }, [handle]);

  const total = quandr3s.length;
  const resolved = quandr3s.filter((q) => q.status === "RESOLVED").length;
  const open = total - resolved;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI",
        background: "#f7f8ff",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Top header */}
        <header
          style={{
            marginBottom: 24,
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 12,
              textDecoration: "none",
              color: "#4a5d88",
            }}
          >
            ← Back to Quandr3
          </Link>
        </header>

        {loading && <p style={{ fontSize: 14 }}>Loading profile…</p>}

        {message && !loading && (
          <p
            style={{
              fontSize: 14,
              color: "#b04141",
              marginBottom: 16,
            }}
          >
            {message}
          </p>
        )}

        {!loading && profile && (
          <>
            {/* Profile card */}
            <section
              style={{
                borderRadius: 24,
                background: "#ffffff",
                padding: 20,
                boxShadow: "0 18px 40px rgba(11,35,67,0.08)",
                marginBottom: 24,
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: BLUE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 26,
                  flexShrink: 0,
                }}
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username || "Avatar"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (profile.display_name || profile.username || "?")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: NAVY,
                    marginBottom: 2,
                  }}
                >
                  {profile.display_name || profile.username}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#4a5d88",
                    marginBottom: 8,
                  }}
                >
                  @{profile.username}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  <StatPill label="Quandr3s" value={total} />
                  <StatPill label="Resolved" value={resolved} />
                  <StatPill label="Open" value={open} />
                </div>
              </div>
            </section>

            {/* Quandr3 list */}
            <section>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  marginBottom: 10,
                  color: NAVY,
                }}
              >
                Quandr3s by @{profile.username}
              </h2>

              {total === 0 && (
                <p
                  style={{
                    fontSize: 14,
                    color: "#555",
                  }}
                >
                  This user hasn&apos;t posted any Quandr3s yet.
                </p>
              )}

              {total > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  {quandr3s.map((q) => (
                    <Link
                      key={q.id}
                      href={`/debug/vote/${q.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <article
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "#ffffff",
                          border: "1px solid #e1e4ff",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                            color: "#1e63f3",
                          }}
                        >
                          {q.category} · {q.status}
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: NAVY,
                          }}
                        >
                          {q.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#5c6c99",
                          }}
                        >
                          {new Date(q.created_at).toLocaleString()}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #dfe6ff",
        background: "#f7f8ff",
        fontSize: 12,
        display: "flex",
        alignItems: "baseline",
        gap: 4,
      }}
    >
      <span
        style={{
          fontWeight: 800,
          color: "#0b2343",
        }}
      >
        {value}
      </span>
      <span style={{ color: "#4a5d88" }}>{label}</span>
    </div>
  );
}
