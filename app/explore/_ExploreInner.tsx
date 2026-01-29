"use client";
// @ts-nocheck

import { useSearchParams } from "next/navigation";

// ✅ Paste your *current* Explore page UI/code below.
// IMPORTANT: Anything that uses useSearchParams must live in this file.

export default function ExploreInner() {
  const sp = useSearchParams();

  // Example read (keep or delete)
  const category = sp.get("category") || "all";

  return (
    <div style={{ padding: 24 }}>
      <h1>Explore</h1>
      <p style={{ opacity: 0.7 }}>
        (ExploreInner) category = <strong>{category}</strong>
      </p>

      {/* ✅ PASTE YOUR EXISTING EXPLORE UI HERE */}
    </div>
  );
}
