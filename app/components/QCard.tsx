// app/components/QCard.tsx (adjust path as needed)

import React from "react";

const colors = {
  cardBg: "#ffffff",
  border: "#e5e7eb",
  pageBg: "#f3f4fb",
  primaryBlue: "#2563eb",
  blueSoft: "#eff6ff",
  textMain: "#111827",
  textSubtle: "#6b7280",
  textMuted: "#9ca3af",
  coral: "#fb6b5b",
};

type QCardProps = {
  category: string;          // e.g. "Money"
  title: string;             // the Quandr3 question
  sampleReasoning?: string;  // short one-line sample
  statusLabel?: string;      // e.g. "Open"
  onOpen?: () => void;
  onViewPosters?: () => void;
  postersLocked?: boolean;   // if true, show lock hint
};

export default function QCard({
  category,
  title,
  sampleReasoning,
  statusLabel = "Open",
  onOpen,
  onViewPosters,
  postersLocked = true,
}: QCardProps) {
  return (
    <section
      style={{
        borderRadius: 20,
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        padding: 18,
        boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Top row: category + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: colors.blueSoft,
            color: colors.primaryBlue,
          }}
        >
          {category}
        </span>

        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            border: `1px solid ${colors.border}`,
            color: colors.textMuted,
            background: "#f9fafb",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 800,
          color: colors.textMain,
          lineHeight: 1.5,
        }}
      >
        {title}
      </h3>

      {/* Sample reasoning */}
      {sampleReasoning && (
        <p
          style={{
            margin: 0,
            marginTop: 6,
            fontSize: 14,
            color: colors.textSubtle,
          }}
        >
          <span style={{ fontWeight: 700 }}>Sample reasoning: </span>
          {sampleReasoning}
        </p>
      )}

      {/* Action row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, ${colors.primaryBlue}, #1d4ed8)`,
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 14,
            boxShadow: "0 12px 28px rgba(37,99,235,0.35)",
            transition: "transform 120ms ease, box-shadow 120ms ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Open
        </button>

        <button
          type="button"
          onClick={onViewPosters}
          disabled={!onViewPosters}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            cursor: onViewPosters ? "pointer" : "not-allowed",
            border: `1px solid ${colors.border}`,
            background: "#f9fafb",
            color: colors.textSubtle,
            fontWeight: 700,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          View posters
          {postersLocked && <span style={{ fontSize: 14 }}>🔒</span>}
        </button>
      </div>
    </section>
  );
}
