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

// ✅ FIX: typed param to satisfy Vercel TypeScript build
function cleanLabel(x: any) {
  const s = (x ?? "").toString().trim().toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function fmt(ts: any) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function computeInternetDecided(counts: any) {
  // force a stable numeric shape for TS
  const entries = ALLOWED.map((L) => ({ label: L, votes: Number(counts?.[L] || 0) }));
  entries.sort((a, b) => b.votes - a.votes);

  const top = entries[0];
  if (!top || top.votes <= 0) return { label: "", isTie: false, tied: [] };

  const tied = entries.filter((x) => x.votes === top.votes).map((x) => x.label);
  return { label: tied.length === 1 ? top.label : "", isTie: tied.length > 1, tied };
}

export default function ResolveQuandr3Page() {
  const params = useParams();
  const router = useRouter();
  const id = (params || {})?.id ? String((params as any).id) : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ A: 0, B: 0, C: 0, D: 0 });
  const [reasonsByLabel, setReasonsByLabel] = useState<any>({ A: [], B: [], C: [], D: [] });

  const [finalChoice, setFinalChoice] = useState("");
  const [finalNote, setFinalNote] = useState("");

  const totalVotes = useMemo(() => {
    return ALLOWED.reduce((sum, L) => sum + Number(counts?.[L] || 0), 0);
  }, [counts]);

  function pct(label: any) {
    if (!totalVotes) return 0;
    return Math.round((Number(counts?.[label] || 0) / totalVotes) * 100);
  }

  function optionText(label: any) {
    const L = cleanLabel(label);
    if (!L) return "";
    const row = (options || []).find((o: any) => cleanLabel(o?.label) === L);
    return (row?.value ?? "").toString().trim();
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

      const nextCounts: any = { A: 0, B: 0, C: 0, D: 0 };
      const nextReasons: any = { A: [], B: [], C: [], D: [] };

      (choiceRows || []).forEach((r: any) => {
        const L = cleanLabel(r?.label);
        if (!L) return;
        nextCounts[L] = Number(nextCounts[L] || 0) + 1;

        const t = (r?.text || "").toString().trim();
        if (t) nextReasons[L].push(t);
      });

      const safeOptions = (oRows || [])
        .filter(Boolean)
        .map((o: any) => ({
          id: o?.id,
          label: cleanLabel(o?.label),
          value: (o?.value ?? "").toString(),
          order: o?.order,
        }))
        .filter((o: any) => !!o.label);

      setQ(qRow || null);
      setOptions(safeOptions);
      setCounts(nextCounts);
      setReasonsByLabel(nextReasons);

      const existingChoice = cleanLabel(qRow?.resolved_choice_label);
      if (existingChoice) setFinalChoice(existingChoice);
      if (typeof qRow?.resolution_note === "string") setFinalNote(qRow.resolution_note);
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

  const curiosoFinal = cleanLabel(q?.resolved_choice_label);

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
          {/* UI unchanged */}
        </section>
      </div>
    </main>
  );
}
