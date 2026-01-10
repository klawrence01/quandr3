// app/components/Reasoning.tsx  (adjust path if needed)

import React from "react";

const colors = {
  pageBg: "#f3f4fb",
  cardBg: "#ffffff",
  border: "#e5e7eb",
  primaryBlue: "#2563eb",
  blueSoft: "#eff6ff",
  coral: "#fb6b5b",
  textMain: "#111827",
  textSubtle: "#4b5563",
  textMuted: "#9ca3af",
};

export type ReasoningPost = {
  id: string;
  displayName: string;
  choice: "A" | "B" | "C";
  text?: string;
  createdAtISO: string;
  isMe?: boolean; // optional flag if you want to highlight the viewer
};

type ReasoningProps = {
  title?: string;
  posts: ReasoningPost[];
  profilesLocked?: boolean;
  onProfileClick?: (post: ReasoningPost) => void; // if omitted, we show locked state
};

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const now = Date.now();
  const diffMin = Math.max(0, Math.floor((now - then) / 60000));

  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} mins ago`;

  const hrs = Math.floor(diffMin / 60);
  if (hrs === 1) return "1 hr ago";
  if (hrs < 24) return `${hrs} hrs ago`;

  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function Reasoning({
  title = "How people think",
  posts,
  profilesLocked = true,
  onProfileClick,
}: ReasoningProps) {
  const lockProfiles = profilesLocked || !onProfileClick;

  return (
    <section
      style={{
        borderRadius: 24,
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        padding: 20,
        boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 850,
            color: colors.textMain,
          }}
        >
          {title}
        </h2>

        <span
          style={{
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {posts.length} reasoning {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      {/* Feed */}
      <div style={{ display: "grid", gap: 10 }}>
        {posts.map((p) => {
          const canClick = !!onProfileClick && !profilesLocked;
          return (
            <article
              key={p.id}
              style={{
                borderRadius: 18,
                border: `1px solid ${colors.border}`,
                background: "#f9fafb",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Top row: name, time, choice pill */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: colors.textMain,
                    }}
                  >
                    {p.isMe ? "You" : p.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    {timeAgo(p.createdAtISO)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: colors.blueSoft,
                      color: colors.primaryBlue,
                    }}
                  >
                    Choice {p.choice}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (canClick && onProfileClick) onProfileClick(p);
                    }}
                    disabled={!canClick}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1px solid ${
                        lockProfiles ? colors.border : colors.primaryBlue
                      }`,
                      background: lockProfiles ? "#ffffff" : colors.blueSoft,
                      color: lockProfiles ? colors.textSubtle : colors.primaryBlue,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: canClick ? "pointer" : "not-allowed",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    View profile
                    {lockProfiles && (
                      <span role="img" aria-label="locked">
                        🔒
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Reasoning text */}
              <div
                style={{
                  fontSize: 14,
                  color: colors.textSubtle,
                  lineHeight: 1.55,
                }}
              >
                {p.text && p.text.trim().length > 0 ? (
                  p.text
                ) : (
                  <span style={{ color: colors.textMuted }}>
                    (No reasoning shared — choice only.)
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {posts.length === 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: `1px dashed ${colors.border}`,
              background: "#ffffff",
              fontSize: 13,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            No reasoning posts yet. Once people start answering, their thinking
            will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
