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

const ALLOWED = ["A", "B", "C", "D"] as const;
type Label = (typeof ALLOWED)[number];

function cleanLabel(x?: any): Label | "" {
  const s = (x || "").toString().trim().toUpperCase();
  return (ALLOWED as readonly string[]).includes(s) ? (s as Label) : "";
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function computeInternetDecided(counts: Record<Label, number>) {
  const entries = ALLOWED.map((L) => [L, counts[L] || 0] as const);
  const sorted = entries.slice().sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const top = sorted[0];
  if (!top || (top[1] || 0) <= 0) return { label: "" as Label | "", isTie: false, tied: [] as Label[] };

  const tied = sorted.filter((x) => (x[1] || 0) === top[1]).map((x) => x[0]);
  return { label: tied.length === 1 ? top[0] : ("" as Label | ""), isTie: tied.length > 1, tied };
}

export default function ResolveQuandr3Page() {
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id as string;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState<any>(null);

  // ✅ IMPORTANT: store only safe (non-null) option rows
  const [options, setOptions] = useState<any[]>([]);

  const [counts, setCounts] = useState<Record<Label, number>>({ A: 0, B: 0, C: 0, D: 0 });
  const [reasonsByLabel, setReasonsByLabel] = useState<Record<Label, string[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [finalChoice, setFinalChoice] = useState<Label | "">("");
  const [finalNote, setFinalNote] = useState("");

  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + (counts[L] || 0), 0);
  }, [counts]);

  function pct(label: Label) {
    if (!totalVotes) return 0;
    return Math.round(((counts[label] || 0) / totalVotes) * 100);
  }

  // ✅ helper: grab option text by label (so we can display option copy)
  function optionText(label: Label) {
    const row: any = (options || []).find((o: any) => cleanLabel(o?.label) === label);
    return ((row?.value ?? "") as any).toString().trim();
  }

  const internet = useMemo(() => computeInternetDecided(counts), [counts]);

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const { data: qRow, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id,title,prompt,context,status,author_id,created_at,closes_at,resolved_choice_label,resolved_at,resolution_note"
        )
        .eq("id", id)
        .single();

      if (qErr) throw qErr;

      const { data: oRows } = await supabase
        .from("quandr3_options")
        .select("id,label,value,order")
        .eq("quandr3_id", id)
        .order("order", { ascending: true });

      const { data: choiceRows } = await supabase.from("quandr3_choices").select("label,text").eq("quandr3_id", id);

      const nextCounts: Record<Label, number> = { A: 0, B: 0, C: 0, D: 0 };
      const nextReasons: Record<Label, string[]> = { A: [], B: [], C: [], D: [] };

      (choiceRows || []).forEach((r: any) => {
        const L = cleanLabel(r?.label);
        if (L) {
          nextCounts[L] += 1;
          const t = (r?.text || "").toString().trim();
          if (t) nextReasons[L].push(t);
        }
      });

      // ✅ null-safe options
      const safeOptions = (oRows || [])
        .filter(Boolean)
        .filter((o: any) => cleanLabel(o?.label))
        .map((o: any) => ({
          id: o.id,
          label: cleanLabel(o.label),
          value: (o.value ?? "").toString(),
          order: o.order,
        }));

      setQ(qRow || null);
      setOptions(safeOptions);
      setCounts(nextCounts);
      setReasonsByLabel(nextReasons);

      // prefill UI with existing resolution if present
      const existingChoice = cleanLabel((qRow as any)?.resolved_choice_label);
      if (existingChoice) setFinalChoice(existingChoice);
      if (typeof (qRow as any)?.resolution_note === "string") setFinalNote((qRow as any).resolution_note);
    } catch (e: any) {
      setErr(e?.message || "Failed to load resolve page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

              {/* Internet Decided (not final) */}
              <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">INTERNET DECIDED</div>

                {totalVotes === 0 ? (
                  <div className="mt-1 text-sm font-bold" style={{ color: NAVY }}>
                    No votes yet.
                  </div>
                ) : internet.isTie ? (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Tie: {internet.tied.join(" / ")}{" "}
                    <span className="text-slate-500 font-semibold">({totalVotes} total votes)</span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Top Voted: <span style={{ color: BLUE }}>{internet.label}</span>{" "}
                    <span className="text-slate-500 font-semibold">
                      ({internet.label ? counts[internet.label] : 0} votes •{" "}
                      {internet.label ? pct(internet.label) : 0}% • {totalVotes} total)
                    </span>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-600">
                  This is the crowd outcome. The <b>Final Decision</b> is made by the Curioso below.
                </div>
              </div>

              {/* Final Decision (Curioso) */}
              {cleanLabel(q?.resolved_choice_label) ? (
                <div className="mt-4 rounded-2xl border p-4">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">FINAL DECISION (CURIOUSO)</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Final Decision: <span style={{ color: BLUE }}>{cleanLabel(q?.resolved_choice_label)}</span>{" "}
                    <span className="text-slate-500 font-semibold">{q?.resolved_at ? `• ${fmt(q.resolved_at)}` : ""}</span>
                  </div>
                  {q?.resolution_note ? (
                    <div className="mt-2 text-sm text-slate-700">{q.resolution_note}</div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500">(No final note provided.)</div>
                  )}
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ALLOWED.map((L) => (
                  <div key={L} className="rounded-2xl border p-4">
                    <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                      Option {L}
                    </div>

                    {optionText(L) ? (
                      <div className="mt-1 text-sm font-semibold text-slate-900">{optionText(L)}</div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">(No option text found)</div>
                    )}

                    <div className="mt-2 text-sm text-slate-700">
                      Votes: <b>{counts[L] || 0}</b> ({pct(L)}%)
                    </div>

                    <div className="mt-3 text-xs font-extrabold tracking-[0.18em] text-slate-500">COMMUNITY REASONS</div>
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
                      Set Final Decision to {L}
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
                  onChange={(e) => setFinalNote((e.target as any).value)}
                  className="mt-2 w-full rounded-2xl border p-3 text-sm"
                  rows={4}
                  placeholder="Explain your final decision..."
                />
              </div>

              {/* Discussion placeholder (honest Phase 1) */}
              <div className="mt-6 rounded-2xl border bg-white p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">DISCUSSION</div>
                <div className="mt-2 text-sm text-slate-700">
                  Coming soon. Phase 2 adds an open discussion thread with replies and back-and-forth.
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  For now, the “Community Reasons” above show why people leaned the way they did.
                </div>
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
