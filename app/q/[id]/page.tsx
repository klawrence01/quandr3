// app/q/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand + Helpers
========================= */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const LETTER = ["A", "B", "C", "D"];

function fmt(ts?: string) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function hoursLeft(createdAt?: string, duration?: number) {
  if (!createdAt || !duration) return 0;
  const end = new Date(createdAt).getTime() + duration * 3600 * 1000;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/* =========================
   Page
========================= */

export default function Quandr3DetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    let alive = true;

    async function load() {
      setLoading(true);

      const { data: qd } = await supabase
        .from("quandr3s")
        .select("*")
        .eq("id", id)
        .single();

      // Options: support either `idx` or `index`
      const { data: opts } = await supabase
        .from("quandr3_options")
        .select("*")
        .eq("quandr3_id", id)
        .order("idx", { ascending: true });

      // Votes: support either `votes` or `quandr3_votes`
      let vts: any[] = [];
      {
        const { data } = await supabase.from("votes").select("*").eq("quandr3_id", id);
        if (Array.isArray(data)) vts = data;
      }

      // Resolution: support either `quandr3_resolutions` or row fields
      let resRow: any = null;
      {
        const { data } = await supabase
          .from("quandr3_resolutions")
          .select("*")
          .eq("quandr3_id", id)
          .maybeSingle();
        resRow = data || null;
      }

      if (!alive) return;

      // Normalize option indexing
      const normalizedOpts = (opts || []).map((o: any, i: number) => {
        const idx =
          typeof o.idx === "number"
            ? o.idx
            : typeof o.index === "number"
            ? o.index
            : i;
        return {
          ...o,
          idx,
        };
      });

      // Sort by idx
      normalizedOpts.sort((a: any, b: any) => (a.idx ?? 999) - (b.idx ?? 999));

      setQ(qd);
      setOptions(normalizedOpts);
      setVotes(vts || []);
      setResolution(resRow);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  const voteCounts = useMemo(() => {
    const map: any = {};
    options.forEach((o: any) => (map[o.idx] = 0));
    votes.forEach((v: any) => {
      // accept picked_index OR choice_index
      const pi =
        typeof v.choice_index === "number"
          ? v.choice_index
          : typeof v.picked_index === "number"
          ? v.picked_index
          : null;
      if (pi === null) return;
      map[pi] = (map[pi] || 0) + 1;
    });
    return map;
  }, [votes, options]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Not found
      </div>
    );
  }

  const status = safeStr(q.status).toLowerCase();
  const isResolved = status === "resolved";
  const hours = hoursLeft(q.created_at, q.voting_duration_hours);

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(180deg, ${SOFT_BG}, #fff)` }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
              {safeStr(q.title) || "Untitled Quandr3"}
            </h1>
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                background: isResolved ? "rgba(0,169,165,0.12)" : "rgba(30,99,243,0.12)",
                color: isResolved ? TEAL : BLUE,
              }}
            >
              {isResolved ? "Resolved" : "Open"}
            </span>
          </div>

          {q.context ? <p className="text-slate-600">{safeStr(q.context)}</p> : null}

          {!isResolved ? (
            <p className="text-sm text-slate-500">⏳ {hours} hour(s) left</p>
          ) : null}
        </div>

        {/* Options / Results */}
        <div className="grid md:grid-cols-2 gap-6">
          {options.map((opt: any, i: number) => {
            const idx = typeof opt.idx === "number" ? opt.idx : i;
            const count = voteCounts[idx] || 0;

            const winnerIdx =
              typeof resolution?.picked_index === "number"
                ? resolution.picked_index
                : typeof resolution?.choice_index === "number"
                ? resolution.choice_index
                : null;

            const isWinner = winnerIdx !== null && winnerIdx === idx;

            // Use same thumbnail approach as Explore:
            // try thumbnail_url, else image_url, else media_url
            const thumb =
              safeStr(opt.thumbnail_url) ||
              safeStr(opt.image_url) ||
              safeStr(opt.media_url) ||
              "";

            const title = safeStr(opt.title) || safeStr(opt.text) || `Option ${LETTER[i] || "?"}`;
            const desc = safeStr(opt.description);

            return (
              <div
                key={opt.id || `${idx}-${i}`}
                className="bg-white rounded-2xl shadow overflow-hidden border"
                style={{
                  borderColor: isWinner ? CORAL : "#e5e7eb",
                }}
              >
                {thumb ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={thumb}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg" style={{ color: NAVY }}>
                    {LETTER[i] ? `${LETTER[i]}. ` : ""}{title}
                  </h3>

                  {desc ? <p className="text-sm text-slate-600">{desc}</p> : null}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-slate-500">
                      {count} vote{count === 1 ? "" : "s"}
                    </span>

                    {isWinner ? (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: CORAL, color: "white" }}
                      >
                        Winner
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resolution Note */}
        {resolution?.note ? (
          <div className="bg-white rounded-2xl shadow p-6 space-y-2">
            <h3 className="font-bold text-lg" style={{ color: NAVY }}>
              Final Decision
            </h3>
            <p className="text-slate-700">{safeStr(resolution.note)}</p>
            <p className="text-xs text-slate-400">Resolved {fmt(resolution.resolved_at)}</p>
          </div>
        ) : null}

        {/* Back */}
        <div className="text-center">
          <Link
            href="/explore"
            className="inline-block px-5 py-2 rounded-lg font-semibold text-white"
            style={{ background: BLUE }}
          >
            ← Back to Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
