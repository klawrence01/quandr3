// app/explore/_ExploreClient.tsx
"use client";

import Link from "next/link";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type Props = {
  initialCategory?: string;
  initialStatus?: string;
  initialScope?: string;

  // keep flexible in case _ExploreInner passes more later
  [key: string]: any;
};

export default function ExploreClient({
  initialCategory = "",
  initialStatus = "trending",
  initialScope = "global",
}: Props) {
  return (
    <div className="min-h-screen" style={{ background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Explore
              </div>
              <h1
                className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl"
                style={{ color: NAVY }}
              >
                Find interesting Quandr3s
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Build-safe Explore placeholder. We’ll polish Explore after Results + Resolve are fully locked.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/q/create"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                style={{ background: BLUE }}
              >
                Create
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
                style={{ color: NAVY }}
              >
                Home
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <div className="text-xs font-semibold text-gray-500">Initial category</div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: TEAL }}>
                {initialCategory || "—"}
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="text-xs font-semibold text-gray-500">Initial status</div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: CORAL }}>
                {initialStatus || "—"}
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="text-xs font-semibold text-gray-500">Initial scope</div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: NAVY }}>
                {initialScope || "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-gray-50 p-4">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Next: wire real Explore feed
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Show Open / Awaiting / Resolved cards</li>
              <li>Option image thumbnails</li>
              <li>Sort: Trending / New / Resolved</li>
              <li>Click-through to /q/[id]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
