// app/profile/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import { ensureProfile } from "@/utils/supabase/profile";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // NEW: loop stats
  const [loopStats, setLoopStats] = useState<{
    total: number;
    open: number;
    resolved: number;
    lastResolved: {
      id: string;
      title: string;
      final_choice: string | null;
      final_note: string | null;
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

      // Profile basics
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (pErr) {
        console.error(pErr);
        setMessage(pErr.message);
      } else if (data) {
        setDisplayName(data.display_name || "");
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
      }

      // NEW: Quandr3 loop stats for this user
      const { data: qs, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id, title, status, final_choice, final_note, resolved_at, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (qErr) {
        console.error(qErr);
        // don't block profile just because stats failed
      } else {
        const list = qs || [];
        const total = list.length;
        const open = list.filter((q) => q.status !== "RESOLVED").length;
        const resolved = list.filter((q) => q.status === "RESOLVED").length;
        const lastResolved =
          list.find((q) => q.status === "RESOLVED") || null;

        setLoopStats({
          total,
          open,
          resolved,
          lastResolved: lastResolved
            ? {
                id: lastResolved.id,
                title: lastResolved.title,
                final_choice: lastResolved.final_choice,
                final_note: lastResolved.final_note,
                resolved_at: lastResolved.resolved_at,
              }
            : null,
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { user, error } = await ensureProfile();
    if (error || !user) {
      setMessage("Please sign in.");
      setLoading(false);
      return;
    }

    // Basic cleanup
    const cleanUsername = username.trim() || null;
    const cleanDisplayName = displayName.trim() || null;
    const cleanAvatar = avatarUrl.trim() || null;

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

  // helper for trimming the final_note preview
  function notePreview(note: string | null) {
    if (!note) return "";
    if (note.length <= 140) return note;
    return note.slice(0, 140) + "…";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
        Your Profile
      </h1>
      <p style={{ fontSize: 14, color: "#555", marginBottom: 24 }}>
        This is how you show up next to your Quandr3s, votes, and comments.
      </p>

      {loading && <p>Loading…</p>}

      {message && (
        <p
          style={{
            fontSize: 14,
            color: "#333",
            marginBottom: 16,
          }}
        >
          {message}
        </p>
      )}

      {!loading && (
        <form onSubmit={handleSave}>
          {/* Display name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
              placeholder="e.g. Kenneth Lawrence"
            />
          </div>

          {/* Username/handle */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Username (handle)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#f7f8ff",
                  fontSize: 14,
                }}
              >
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
                placeholder="klawrence01"
              />
            </div>
            <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
              Usernames are unique. Letters, numbers, no spaces. People will
              find you at <strong>quandr3.com/u/yourname</strong>.
            </p>
          </div>

          {/* Avatar URL */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Avatar image URL (optional)
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
              placeholder="https://…"
            />
            <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
              Later we can add photo uploads. For now, you can paste any image
              URL if you have one.
            </p>
          </div>

          {/* Preview */}
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              borderRadius: 14,
              border: "1px solid #e1e4ff",
              background: "#f7f8ff",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                overflow: "hidden",
                background: "#1e63f3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="avatar preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                (displayName || username || "?")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 2,
                }}
              >
                {displayName || "Your display name"}
              </div>
              <div style={{ fontSize: 13, color: "#555" }}>
                {username ? "@" + username : "@yourusername"}
              </div>
            </div>
          </div>

          {/* NEW: Quandr3 loop summary */}
          <div
            style={{
              marginBottom: 24,
              padding: 14,
              borderRadius: 16,
              border: "1px solid #e1e4ff",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 6,
                color: "#1e3253",
              }}
            >
              Your Quandr3 loop
            </div>

            {!loopStats || loopStats.total === 0 ? (
              <p style={{ fontSize: 12, color: "#666" }}>
                You haven&apos;t posted any Quandr3s yet. When you do, you&apos;ll see
                how many you&apos;ve opened, resolved, and what you chose last.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 8,
                    fontSize: 12,
                    color: "#33415c",
                  }}
                >
                  <span>
                    <strong>{loopStats.total}</strong> posted
                  </span>
                  <span>
                    <strong>{loopStats.open}</strong> open
                  </span>
                  <span>
                    <strong>{loopStats.resolved}</strong> resolved
                  </span>
                </div>

                {loopStats.lastResolved && (
                  <div
                    style={{
                      marginTop: 4,
                      paddingTop: 8,
                      borderTop: "1px solid #eef1ff",
                      fontSize: 12,
                      color: "#444",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        fontWeight: 700,
                        color: "#1e63f3",
                        marginBottom: 2,
                      }}
                    >
                      Latest outcome shared
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {loopStats.lastResolved.title}
                    </div>
                    {loopStats.lastResolved.final_choice && (
                      <div style={{ marginBottom: 2 }}>
                        <strong>Chose option:</strong>{" "}
                        {loopStats.lastResolved.final_choice}
                      </div>
                    )}
                    {loopStats.lastResolved.final_note && (
                      <div style={{ fontSize: 12, color: "#555" }}>
                        {notePreview(loopStats.lastResolved.final_note)}
                      </div>
                    )}
                    {loopStats.lastResolved.resolved_at && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#8892b0",
                        }}
                      >
                        Resolved{" "}
                        {new Date(
                          loopStats.lastResolved.resolved_at
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 10,
              borderRadius: 999,
              border: "none",
              background: "#1e63f3",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {loading ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
    </main>
  );
}
