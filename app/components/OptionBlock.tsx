"use client";

import React from "react";

type OptionBlockProps = {
  label: string;        // e.g. "A"
  text: string;         // option text
  selected?: boolean;
  disabled?: boolean;
  helperText?: string;  // e.g. "Tap to select"
  onSelect?: () => void;
};

const colors = {
  cardBg: "#ffffff",
  borderDefault: "#e5e7eb",
  borderSelected: "#2563eb",
  pillBg: "#eff6ff",
  pillText: "#1d4ed8",
  textMain: "#111827",
  textSubtle: "#6b7280",
};

export default function OptionBlock({
  label,
  text,
  selected = false,
  disabled = false,
  helperText,
  onSelect,
}: OptionBlockProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 18,
        padding: 14,
        border: `1px solid ${
          selected ? colors.borderSelected : colors.borderDefault
        }`,
        backgroundColor: colors.cardBg,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: selected
          ? "0 10px 24px rgba(37,99,235,0.18)"
          : "0 4px 12px rgba(15,23,42,0.04)",
        transition:
          "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Left side: label + text */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${
              selected ? colors.borderSelected : colors.borderDefault
            }`,
            background: selected ? colors.pillBg : "#f9fafb",
            fontWeight: 900,
            color: selected ? colors.pillText : colors.textMain,
            fontSize: 16,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: colors.textMain,
          }}
        >
          {text}
        </div>
      </div>

      {/* Right side: helper pill */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: selected ? colors.pillBg : "#f3f4f6",
            color: selected ? colors.pillText : colors.textSubtle,
            border: selected
              ? `1px solid ${colors.borderSelected}`
              : `1px solid ${colors.borderDefault}`,
          }}
        >
          {disabled
            ? "Locked"
            : helperText ?? (selected ? "Selected" : "Tap to select")}
        </span>
      </div>
    </button>
  );
}
