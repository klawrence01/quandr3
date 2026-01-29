"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ResultsPage() {
  const { id } = useParams();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/explore">Browse Quandr3s</Link>
        <Link href="/q/create">Create Quandr3</Link>
      </div>

      <h1 style={{ marginTop: 18 }}>Results</h1>
      <p style={{ color: "#666" }}>
        This page is scaffolded. Results are currently shown on the detail page.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href={`/q/${id}`}>← Back to Quandr3</Link>
      </div>
    </div>
  );
}
