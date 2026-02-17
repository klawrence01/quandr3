// /app/q/[id]/resolve/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand
========================= */

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

const ALLOWED = ["A", "B", "C", "D"];

function cleanLabel(x?: any) {
  const s = (x || "").toString().trim().toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function ResolveQuandr3Page() {
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id as string;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });
  const [reasonsByLabel, setReasonsByLabel] = useState<Record<string, string[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [finalChoice, setFinalChoice] = useState<string>("");
  const [finalNote, setFinalNote] = useState<string>("");

  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + (counts[L] || 0), 0);
  }, [counts]);

  function pct(label: string) {
    if (!totalVotes) return 0;
    return Math.round(((counts[label] || 0) / totalVotes) * 100);
  }

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const { data: qRow, error: qErr } = await supabase
        .from("quandr3s")
        .select("id,title,prompt,context,status,author_id,created_at,closes_at")
        .eq("id", id)
        .single();

      if (qErr) throw qErr;

      const { data: oRows } = await supabase
        .from("quandr3_options")
        .select("id,label,value,order")
        .eq("quandr3_id", id)
        .order("order", { ascending: true });

      const { data: choiceRows } = await supabase
        .from("quandr3_choices")
        .select("label,text")
        .eq("quandr3_id", id);

      const counts: any = { A: 0, B: 0, C: 0, D: 0 };
      const reasons: any = { A: [], B: [], C: [], D: [] };

      (choiceRows || []).forEach((r: any) => {
        const L = cleanLabel(r?.label);
        if (L) {
          counts[L]++;
          if (r?.text) reasons[L].push(r.text);
        }
      });

      setQ(qRow);
      setOptions((oRows || []).filter((o: any) => cleanLabel(o?.label)));
      setCounts(counts);
      setReasonsByLabel(reasons);
    } catch (e: any) {
      setErr(e?.message || "Failed to load resolve page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function submitResolution() {
    if (!finalChoice) {
      alert("Pick a final choice (A–D)");
      return;
    }

    try {
      const { error } = await supabase
        .from("quandr3s")
        .update({
          status: "resolved",
          resolved_choice_label: finalChoice,
          resolved_at: new Date().toISOString(),
          resolution_note: finalNote,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Resolution saved.");
      router.push(`/q/${id}`);
    } catch (e: any) {
      alert(e?.message || "Failed to resolve.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href={`/q/${id}`}
          className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
          style={{ color: NAVY }}
        >
          ← Back to Quandr3
        </Link>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div>Loading…</div>
          ) : err ? (
            <div className="text-red-600 font-semibold">{err}</div>
          ) : !q ? (
            <div>Not found.</div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>
                Resolve: {q.title}
              </h1>

              <p className="mt-2 text-slate-700">{q.prompt || q.context}</p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ALLOWED.map((L) => (
                  <div key={L} className="rounded-2xl border p-4">
                    <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                      Option {L}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      Votes: <b>{counts[L]}</b> ({pct(L)}%)
                    </div>

                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {(reasonsByLabel[L] || []).slice(0, 6).map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>

                    <label className="mt-3 flex items-center gap-2 text-sm font-bold">
                      <input
                        type="radio"
                        name="final"
                        value={L}
                        checked={finalChoice === L}
                        onChange={() => setFinalChoice(L)}
                      />
                      Choose {L}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm font-extrabold" style={{ color: NAVY }}>
                  Final Note (optional)
                </label>
                <textarea
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  className="mt-2 w-full rounded-2xl border p-3 text-sm"
                  rows={4}
                  placeholder="Explain your final decision..."
                />
              </div>

              <button
                type="button"
                onClick={submitResolution}
                className="mt-6 rounded-full px-6 py-3 text-sm font-extrabold text-white hover:opacity-95"
                style={{ background: BLUE }}
              >
                Publish Final Resolution
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
