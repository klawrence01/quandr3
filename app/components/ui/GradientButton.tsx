"use client";

import React from "react";

export default function GradientButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "12px 22px",
        borderRadius: 999,
        border: "none",
        background:
          "linear-gradient(135deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
        color: "#ffffff",
        fontWeight: 850,
        letterSpacing: 0.2,
        opacity: disabled ? 0.55 : 1,
        boxShadow: disabled
          ? "none"
          : "0 14px 34px rgba(11,35,67,0.28)",
        transition: "transform 120ms ease, filter 120ms ease",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}
