// app/explore/_ExploreInner.tsx
"use client";
// @ts-nocheck

import { useSearchParams } from "next/navigation";
import ExploreClient from "./_ExploreClient";

// IMPORTANT: Anything that uses useSearchParams must live in this file.

export default function ExploreInner() {
  const sp = useSearchParams();

  // Accept both styles of params:
  // - your old placeholder used: category/status/scope
  // - your new explore client used: cat/status/sort
  const initialCategory = sp.get("cat") || sp.get("category") || "All";
  const initialStatus = sp.get("status") || "all";
  const initialScope = sp.get("scope") || "global";
  const initialSort = sp.get("sort") || "trending";

  return (
    <ExploreClient
      initialCategory={initialCategory}
      initialStatus={initialStatus}
      initialScope={initialScope}
      initialSort={initialSort}
    />
  );
}
