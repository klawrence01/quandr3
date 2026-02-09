"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

type Vote = { pickedIndex: number; votedAt: string; voteId?: string };
type Resolution = {
  pickedIndex: number;
  note?: string;
  resolvedAt: string;
  optionId?: string;
};

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

export default function Quandr3DetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const { data: qRow } = await supabase
        .from("quandr3s")
        .select("*")
        .eq("id", id)
        .single();

      const { data: opts } = await supabase
        .from("quandr3_options")
        .select("*")
        .eq("quandr3_id", id)
        .order("idx");

      const { data: vts } = await supabase
        .from("votes")
        .select("*")
        .eq("quandr3_id", id);

      const { data: res } = await supabase
        .from("quandr3_resolutions")
        .select("*")
        .eq("quandr3_id", id)
        .maybeSingle();

      setQ(qRow);
      setOptions(opts || []);
      setVotes(vts || []);
      setResolution(res || null);
      setLoading(false);
    })();
  }, [id]);

  const totals = useMemo(() => {
    const map: Record<number, number> = {};
    options.forEach((o) => (map[o.idx] = 0));
    votes.forEach((v) => {
      map[v.pickedIndex] = (map[v.pickedIndex] || 0) + 1;
    });
    return map;
  }, [options, votes]);

  const maxVotes = Math.max(1, ...Object.values(totals));

  if (loading) return <div className="p-6">Loading…</div>;
  if (!q) return <div className="p-6">Not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/explore" className="text-sm text-blue-600 hover:underline">
        ← Back to Explore
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        {safeStr(q.title || q.prompt)}
      </h1>

      <p className="mt-2 text-slate-600">{safeStr(q.description)}</p>

      <div className="mt-8 space-y-6">
        {options.map((opt, i) => {
          const count = totals[opt.idx] || 0;
          const pct = Math.round((count / maxVotes) * 100);

          return (
            <div
              key={opt.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              {/* 🔽 SHRUNK IMAGE HEADER */}
              <div className="h-[140px] w-full overflow-hidden bg-slate-900">
                {opt.image_url ? (
                  <img
                    src={opt.image_url}
                    alt=""
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : null}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Option {String.fromCharCode(65 + i)} – {safeStr(opt.label)}
                  </h3>

                  {resolution && (
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                      Resolved
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {count} votes • {pct}%
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: BLUE,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
