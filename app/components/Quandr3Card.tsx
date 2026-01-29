// app/components/Quandr3Card.tsx
"use client";

import Link from "next/link";

type Quandr3CardProps = {
  id: string;
  title: string;
  category: string;
  status: "open" | "closed" | "resolved" | string;
  createdAt: string; // ISO string
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusPill({ status }: { status?: string }) {
  // ✅ DEFENSIVE: never crash on undefined
  const lowered = String(status || "open").toLowerCase();

  let label = "Open";
  let classes =
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/60";

  if (lowered === "resolved") {
    label = "Resolved";
    classes =
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-300/60";
  } else if (lowered === "closed") {
    label = "Closed";
    classes =
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-300/60";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label.toUpperCase()}
    </span>
  );
}

export default function Quandr3Card({
  id,
  title,
  category,
  status,
  createdAt,
}: Quandr3CardProps) {
  return (
    <Link
      href={`/q/${id}`}
      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 line-clamp-2">
            {title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {category || "General"}
            </span>
            <span>•</span>
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>
        <StatusPill status={status} />
      </div>
    </Link>
  );
}
