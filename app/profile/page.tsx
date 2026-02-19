// app/profile/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";
import { ensureProfile } from "@/utils/supabase/profile";

/* =========================
   Brand
========================= */
const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(x: any) {
  return (x ?? "").toString();
}

function notePreview(note: string | null, n = 140) {
  if (!note) return "";
  const t = safeStr(note).trim();
  if (t.length <= n) return t;
  return t.slice(0, n).trim() + "…";
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [meId, setMeId] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // ✅ Quandr3 loop stats (your posts)
  const [loopStats, setLoopStats] = useState<{
    total: number;
    open: number;
    closed: number; // awaiting_user
    resolved: number;
    lastResolved: {
      id: string;
      title: string;
      resolved_choice_label: string | null;
      resolution_note: string | null;
      resolved_at: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      const { user, error } = await ensureProfile();
      if (error || !user) {
        setMessage("Please sign in to edit your profile.");
        setLoading(false);
        return;
      }

      setMeId(user.id);

      // Profile basics
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (pErr) {
        console.error(pErr);
        setMessage(pErr.message);
      } else if (prof) {
        setDisplayName(safeStr(prof.display_name));
        setUsername(safeStr(prof.username));
        setAvatarUrl(safeStr(prof.avatar_url));
      }

      // ✅ Loop stats: use current schema + status values
      // - author_id is the owner of the post
      // - status: open | awaiting_user | resolved
      // - resolved_choice_label + resolution_note are the verdict fields
      const { data: qs, error: qErr } = await supabase
        .from("quandr3s")
        .select("id,title,status,created_at,resolved_at,resolved_choice_label,resolution_note")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (qErr) {
        console.error(qErr);
        // don't block profile
        setLoopStats(null);
      } else {
        const list = (qs || []).map((q: any) => ({
          ...q,
          status: safeStr(q?.status).toLowerCase(),
        }));

        const total = list.length;
        const open = list.filter((q: any) => q.status === "open").length;
        const closed = list.filter((q: any) => q.status === "awaiting_user").length;
        const resolved = list.filter((q: any) => q.status === "resolved").length;

        const lastResolved = list.find((q: any) => q.status === "resolved") || null;

        setLoopStats({
          total,
          open,
          closed,
          resolved,
          lastResolved: lastResolved
            ? {
                id: lastResolved.id,
                title: safeStr(lastResolved.title),
                resolved_choice_label: safeStr(lastResolved.resolved_choice_label) || null,
                resolution_note: safeStr(lastResolved.resolution_note) || null,
                resolved_at: lastResolved.resolved_at || null,
              }
            : null,
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSave(e: any) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { user, error } = await ensureProfile();
    if (error || !user) {
      setMessage("Please sign in.");
      setLoading(false);
      return;
    }

    const cleanUsername = safeStr(username).trim().replace(/\s+/g, "").toLowerCase() || null;
    const cleanDisplayName = safeStr(displayName).trim() || null;
    const cleanAvatar = safeStr(avatarUrl).trim() || null;

    const { error: uErr } = await supabase
      .from("profiles")
      .update({
        display_name: cleanDisplayName,
        username: cleanUsername,
        avatar_url: cleanAvatar,
      })
      .eq("id", user.id);

    if (uErr) {
      console.error(uErr);
      if (
        uErr.code === "23505" ||
        (uErr.message && uErr.message.toLowerCase().includes("duplicate"))
      ) {
        setMessage("That username is already taken. Try another one.");
      } else {
        setMessage(uErr.message);
      }
      setLoading(false);
      return;
    }

    setMessage("Profile updated.");
    setLoading(false);
  }

  const previewInitial = useMemo(() => {
    const t = (displayName || username || "?").trim();
    return t ? t.charAt(0).toUpperCase() : "?";
  }, [displayName, username]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        padding: 40,
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 740, margin: "0 auto" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6, color: NAVY }}>
              Your Profile
            </h1>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 0 }}>
              This is how you show up next to your Quandr3s, votes, and comments.
            </p>
          </div>

          {meId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/u/${meId}`}
                className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                style={{ color: NAVY }}
              >
                View public profile
              </Link>
              <Link
                href={`/u/${meId}/following`}
                className="rounded-full px-4 py-2 text-sm font-extrabold text-white"
                style={{ background: BLUE }}
              >
                Following
              </Link>
            </div>
          ) : null}
        </div>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm">
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

          {message ? (
            <p className="text-sm font-semibold" style={{ color: message.includes("updated") ? TEAL : "#b91c1c" }}>
              {message}
            </p>
          ) : null}

          {!loading ? (
            <form onSubmit={handleSave}>
              {/* Display name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6, color: NAVY }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border p-3 text-sm outline-none"
                  placeholder="e.g. Kenneth Lawrence"
                />
              </div>

              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6, color: NAVY }}>
                  Username (handle)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      padding: "10px 12px",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      background: "#f8fafc",
                      fontSize: 14,
                      fontWeight: 900,
                      color: NAVY,
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                    className="w-full rounded-2xl border p-3 text-sm outline-none"
                    placeholder="klawrence01"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Usernames are unique. Letters/numbers, no spaces.
                </p>
              </div>

              {/* Avatar URL */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6, color: NAVY }}>
                  Avatar image URL (optional)
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-2xl border p-3 text-sm outline-none"
                  placeholder="https://…"
                />
                <p className="mt-2 text-xs text-slate-500">Later we can add uploads. For now, paste any image URL.</p>
              </div>

              {/* Preview */}
              <div
                style={{
                  marginBottom: 18,
                  padding: 12,
                  borderRadius: 18,
                  border: "1px solid rgba(30,99,243,0.18)",
                  background: "#f7f8ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #1e63f3, #00a9a5, #ff6b6b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="avatar preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    previewInitial
                  )}
                </div>

                <div className="min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 900, color: NAVY }} className="truncate">
                    {displayName || "Your display name"}
                  </div>
                  <div style={{ fontSize: 13, color: "#475569" }} className="truncate">
                    {username ? "@" + username : "@yourusername"}
                  </div>
                </div>
              </div>

              {/* Loop summary */}
              <div
                style={{
                  marginBottom: 22,
                  padding: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: "#64748b" }}>
                  YOUR QUANDR3 LOOP
                </div>

                {!loopStats || loopStats.total === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">
                    You haven&apos;t posted any Quandr3s yet. When you do, you&apos;ll see your open/closed/resolved
                    breakdown here.
                  </p>
                ) : (
                  <>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
                      <span>
                        <b style={{ color: NAVY }}>{loopStats.total}</b> posted
                      </span>
                      <span>
                        <b style={{ color: TEAL }}>{loopStats.open}</b> open
                      </span>
                      <span>
                        <b style={{ color: "#b45309" }}>{loopStats.closed}</b> closed
                      </span>
                      <span>
                        <b style={{ color: BLUE }}>{loopStats.resolved}</b> resolved
                      </span>
                    </div>

                    {loopStats.lastResolved ? (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: "1px solid rgba(15,23,42,0.06)",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: BLUE }}>
                          LATEST OUTCOME SHARED
                        </div>
                        <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                          {loopStats.lastResolved.title}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-extrabold"
                            style={{ background: "#eef2ff", color: NAVY }}
                          >
                            Final decision:{" "}
                            <span style={{ color: BLUE }}>
                              {safeStr(loopStats.lastResolved.resolved_choice_label) || "—"}
                            </span>
                          </span>

                          <Link
                            href={`/q/${loopStats.lastResolved.id}`}
                            className="text-xs font-extrabold underline"
                            style={{ color: TEAL }}
                          >
                            View results →
                          </Link>
                        </div>

                        {loopStats.lastResolved.resolution_note ? (
                          <div className="mt-2 text-sm text-slate-700">
                            {notePreview(loopStats.lastResolved.resolution_note, 180)}
                          </div>
                        ) : null}

                        {loopStats.lastResolved.resolved_at ? (
                          <div className="mt-2 text-xs text-slate-500">
                            Resolved {new Date(loopStats.lastResolved.resolved_at).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                style={{ background: BLUE }}
              >
                {loading ? "Saving…" : "Save profile"}
              </button>
            </form>
          ) : null}
        </section>

        <div className="mt-6 text-center text-xs text-slate-500">
          Quandr3: <span className="font-semibold">Ask.</span>{" "}
          <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </main>
  );
}
