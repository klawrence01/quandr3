"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

export default function Quandr3DetailPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);

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

      setQ(qRow || null);
      setOptions(opts || []);
      setVotes(vts || []);
      setResolution(res || null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!q) return <div className="p-6">Not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/explore" className="text-sm text-blue-600 hover:underline">
        ← Back to Explore
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        {q.title || q.prompt}
      </h1>

      <p className="mt-2 text-slate-600">{q.description}</p>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Options</h2>

        {options.length === 0 ? (
          <div className="rounded-lg border bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠️ No options loaded for this quandr3. Check Supabase data.
          </div>
        ) : (
          <div className="space-y-4">
            {options.map((opt, i) => (
              <div
                key={opt.id}
                className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                {/* Small thumbnail instead of huge banner */}
                <div className="h-[80px] w-[120px] overflow-hidden rounded-xl bg-slate-900 shrink-0">
                  {opt.image_url && (
                    <img
                      src={opt.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">
                      Option {String.fromCharCode(65 + i)} – {opt.label}
                    </h3>

                    {resolution && (
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
