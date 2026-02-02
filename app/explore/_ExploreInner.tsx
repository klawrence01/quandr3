// app/explore/_ExploreInner.tsx
"use client";
// @ts-nocheck

import { useSearchParams } from "next/navigation";
import ExploreClient from "./_ExploreClient";

// IMPORTANT: Anything that uses useSearchParams must live in this file.

export default function ExploreInner() {
  const sp = useSearchParams();

  const initialCategory = sp.get("category") || "all";
  const initialStatus = sp.get("status") || "all";
  const initialScope = sp.get("scope") || "global";

  return (
    <ExploreClient
      initialCategory={initialCategory}
      initialStatus={initialStatus}
      initialScope={initialScope}
    />
  );
}
