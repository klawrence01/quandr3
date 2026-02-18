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

function cleanLabel(x: any) {
  const s = (x ?? "").toString().trim().toUpperCase();
  return ALLOWED.includes(s) ? s : "";
}

function safeStr(x: any) {
  return (x ?? "").toString();
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
  const entries = ALLOWED.map((L) => ({ label: L, votes: Number(counts?.[L] || 0) }));
  entries.sort((a, b) => b.votes - a.votes);

  const top = entries[0];
  if (!top || top.votes <= 0) return { label: "", isTie: false, tied: [] as string[] };

  const tied = entries.filter((x) => x.votes === top.votes).map((x) => x.label);
  return { label: tied.length === 1 ? top.label : "", isTie: tied.length > 1, tied };
}

function pct(counts: any, totalVotes: number, label: string) {
  if (!totalVotes) return 0;
  return Math.round((Number(counts?.[label] || 0) / totalVotes) * 100);
}

async function shareOrCopy(url: string) {
  try {
    // @ts-ignore
    if (navigator?.share) {
      // @ts-ignore
      await navigator.share({ title: "Quandr3", url });
      return { ok: true, mode: "share" };
    }
  } catch {}
  try {
    // @ts-ignore
    await navigator.clipboard.writeText(url);
    return { ok: true, mode: "copy" };
  } catch {}
  return { ok: false, mode: "none" };
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

  // ✅ Category is mandatory (and editable here to fix older posts)
  const [category, setCategory] = useState("");
  const categoryClean = useMemo(() => safeStr(category).trim(), [category]);

  // share UX
  const [shareMsg, setShareMsg] = useState("");

  const totalVotes = useMemo(() => ALLOWED.reduce((sum, L) => sum + Number(counts?.[L] || 0), 0), [counts]);
  const internet = useMemo(() => computeInternetDecided(counts), [counts]);

  const curiosoFinal = useMemo(() => cleanLabel(q?.resolved_choice_label), [q]);
  const canPublish = useMemo(() => !!cleanLabel(finalChoice) && !!categoryClean, [finalChoice, categoryClean]);

  function optionText(label: string) {
    const L = cleanLabel(label);
    if (!L) return "";
    const row = (options || []).find((o) => cleanLabel(o?.label) === L);
    return safeStr(row?.value).trim();
  }

  function isCrowdWinner(label: string) {
    if (!label) return false;
    if (internet.isTie) return internet.tied.includes(label);
    return internet.label === label;
  }

  function isCuriosoWinner(label: string) {
    return !!curiosoFinal && curiosoFinal === label;
  }

  function winnerStyles(label: string) {
    if (isCuriosoWinner(label)) {
      return {
        border: `2px solid ${BLUE}`,
        bg: "#f2f7ff",
        badgeBg: BLUE,
        badgeFg: "white",
        badgeText: "CURIOUSO VERDICT",
      };
    }

    if (isCrowdWinner(label)) {
      return {
        border: `2px solid ${CORAL}`,
        bg: "#fff5f5",
        badgeBg: CORAL,
        badgeFg: "white",
        badgeText: internet.isTie ? "CROWD TIED" : "INTERNET DECIDED",
      };
    }

    return {
      border: "1px solid #e5e7eb",
      bg: "white",
      badgeBg: "#eef2ff",
      badgeFg: NAVY,
      badgeText: "",
    };
  }

  async function load() {
    setLoading(true);
    setErr("");
    setShareMsg("");

    try {
      const { data: qRow, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id,title,prompt,context,category,status,author_id,created_at,closes_at,city,state,resolved_choice_label,resolved_at,resolution_note"
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
        const t = safeStr(r?.text).trim();
        if (t) nextReasons[L].push(t);
      });

      const safeOptions = (oRows || [])
        .filter(Boolean)
        .map((o: any) => ({
          id: o?.id,
          label: cleanLabel(o?.label),
          value: safeStr(o?.value),
          order: o?.order,
        }))
        .filter((o: any) => !!o.label);

      setQ(qRow || null);
      setOptions(safeOptions);
      setCounts(nextCounts);
      setReasonsByLabel(nextReasons);

      // Prefill editors
      const existingChoice = cleanLabel(qRow?.resolved_choice_label);
      if (existingChoice) setFinalChoice(existingChoice);
      if (typeof qRow?.resolution_note === "string") setFinalNote(qRow.resolution_note);

      // ✅ Category editor
      setCategory(safeStr(qRow?.category || "").trim());
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
    setShareMsg("");

    const chosen = cleanLabel(finalChoice);
    if (!categoryClean) {
      alert("Category is required. Add a category first.");
      return;
    }
    if (!chosen) {
      alert("Pick a final choice (A–D)");
      return;
    }

    try {
      const nowIso = new Date().toISOString();

const { error } = await supabase
  .from("quandr3s")
  .update({
    category: categoryClean, // ✅ mandatory
    status: "resolved",
    resolved_choice_label: chosen,
    resolved_at: nowIso,
    resolution_note: finalNote,
    published_at: nowIso, // ✅ NEW: makes it immediately "released" unless queue schedules it later
  })
  .eq("id", id);


      if (error) throw error;

      try {
        localStorage.setItem("quandr3_explore_refresh", String(Date.now()));
      } catch {}

      // keep it on this page (so you immediately see highlight), but refresh
      await load();
      // optional: router.push(`/q/${id}`);
      alert("Resolution saved.");
    } catch (e: any) {
      alert(e?.message || "Failed to resolve.");
    }
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/q/${id}` : `/q/${id}`;
    const res = await shareOrCopy(url);
    setShareMsg(
      res.ok
        ? res.mode === "share"
          ? "Shared."
          : "Link copied."
        : "Could not share/copy on this device."
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/q/${id}`}
            className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
            style={{ color: NAVY }}
          >
            ← Back to Quandr3
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/q/${id}`}
              className="rounded-full border bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
              style={{ color: NAVY }}
            >
              View results page
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
              style={{ background: NAVY }}
              title="Share this Quandr3"
            >
              Share
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div>Loading…</div>
          ) : err ? (
            <div className="text-red-600 font-semibold">{err}</div>
          ) : !q ? (
            <div>Not found.</div>
          ) : (
            <>
              {/* ✅ Category REQUIRED editor */}
              <div className="mb-4 rounded-2xl border p-4" style={{ background: "#f8fafc" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">CATEGORY (REQUIRED)</div>
                    <div className="mt-1 text-xs text-slate-600">
                      This must be set before publishing the Curioso Verdict.
                    </div>
                  </div>

                  {(q?.city || q?.state) ? (
                    <div className="text-xs font-bold text-slate-600">
                      {q?.city ? q.city : ""}
                      {q?.city && q?.state ? ", " : ""}
                      {q?.state ? q.state : ""}
                    </div>
                  ) : null}
                </div>

                <input
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  placeholder="Example: Career, Money, Relationships..."
                  className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none"
                />

                {!categoryClean ? (
                  <div className="mt-2 text-xs font-semibold text-red-600">
                    Category is required.
                  </div>
                ) : null}
              </div>

              <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>
                Resolve: {q?.title}
              </h1>

              <p className="mt-2 text-slate-700">{q?.prompt || q?.context}</p>

              {/* ✅ Curioso link + context (your “mini profile” = context) */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full border px-3 py-1 font-bold" style={{ color: NAVY }}>
                  status: {q?.status || "—"}
                </span>
                <span>• Posted: {fmt(q?.created_at)}</span>
                <span>• Closes: {fmt(q?.closes_at)}</span>
                <span>• Total votes: {totalVotes}</span>

                {q?.author_id ? (
                  <>
                    <span className="text-slate-400">•</span>
                    <Link
                      href={`/u/${q.author_id}`}
                      className="font-extrabold underline"
                      style={{ color: NAVY }}
                    >
                      View Curioso
                    </Link>
                  </>
                ) : null}
              </div>

              {shareMsg ? (
                <div className="mt-2 text-xs font-semibold" style={{ color: TEAL }}>
                  {shareMsg}
                </div>
              ) : null}

              {/* INTERNET DECIDED */}
              <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">INTERNET DECIDED</div>

                {totalVotes === 0 ? (
                  <div className="mt-1 text-sm font-bold" style={{ color: NAVY }}>
                    No votes yet.
                  </div>
                ) : internet.isTie ? (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Crowd tie: {internet.tied.join(" / ")}{" "}
                    <span className="text-slate-500 font-semibold">({totalVotes} total votes)</span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Top voted: <span style={{ color: CORAL }}>{internet.label}</span>{" "}
                    <span className="text-slate-500 font-semibold">
                      ({Number(counts?.[internet.label] || 0)} votes • {pct(counts, totalVotes, internet.label)}% •{" "}
                      {totalVotes} total)
                    </span>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-600">
                  This is the crowd outcome. The <b>Curioso Verdict</b> is the official final decision.
                </div>
              </div>

              {/* CURIOUSO VERDICT */}
              <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: curiosoFinal ? BLUE : "#e5e7eb" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">CURIOUSO VERDICT</div>
                  {q?.resolved_at ? (
                    <div className="text-xs text-slate-500">Resolved: {fmt(q.resolved_at)}</div>
                  ) : (
                    <div className="text-xs text-slate-500">Not resolved yet</div>
                  )}
                </div>

                {curiosoFinal ? (
                  <>
                    <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                      Final decision: <span style={{ color: BLUE }}>{curiosoFinal}</span>
                    </div>
                    {q?.resolution_note ? (
                      <div className="mt-2 text-sm text-slate-700">{q.resolution_note}</div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">(No final note provided.)</div>
                    )}
                  </>
                ) : (
                  <div className="mt-2 text-sm text-slate-700">Pick a final decision below, then publish your verdict.</div>
                )}
              </div>

              {/* OPTIONS + REASONS */}
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ALLOWED.map((L) => {
                  const styles = winnerStyles(L);
                  const votes = Number(counts?.[L] || 0);
                  const percent = pct(counts, totalVotes, L);

                  return (
                    <div
                      key={L}
                      className="rounded-2xl p-4"
                      style={{ border: styles.border, background: styles.bg }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                            Option {L}
                          </div>

                          {optionText(L) ? (
                            <div className="mt-1 text-sm font-semibold text-slate-900">{optionText(L)}</div>
                          ) : (
                            <div className="mt-1 text-xs text-slate-500">(No option text found)</div>
                          )}
                        </div>

                        {styles.badgeText ? (
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-extrabold"
                            style={{ background: styles.badgeBg, color: styles.badgeFg }}
                          >
                            {styles.badgeText}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-sm text-slate-700">
                        Votes: <b>{votes}</b> ({percent}%)
                      </div>

                      <div className="mt-3 text-xs font-extrabold tracking-[0.18em] text-slate-500">
                        WHY PEOPLE CHOSE {L}
                      </div>

                      {(reasonsByLabel?.[L] || []).length === 0 ? (
                        <div className="mt-2 text-xs text-slate-500">No reasons yet.</div>
                      ) : (
                        <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-1">
                          {(reasonsByLabel?.[L] || []).slice(0, 8).map((t: any, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      )}

                      <label className="mt-3 flex items-center gap-2 text-sm font-bold">
                        <input
                          type="radio"
                          name="final"
                          value={L}
                          checked={finalChoice === L}
                          onChange={() => setFinalChoice(L)}
                        />
                        Set Curioso verdict to {L}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Verdict note */}
              <div className="mt-6">
                <label className="text-sm font-extrabold" style={{ color: NAVY }}>
                  Curioso note (optional)
                </label>
                <textarea
                  value={finalNote}
                  onChange={(e: any) => setFinalNote(e.target.value)}
                  className="mt-2 w-full rounded-2xl border p-3 text-sm"
                  rows={4}
                  placeholder="Explain why you chose the final decision..."
                />
              </div>

              <button
                type="button"
                onClick={submitResolution}
                disabled={!canPublish}
                className="mt-6 rounded-full px-6 py-3 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-50"
                style={{ background: BLUE }}
                title={!categoryClean ? "Category required" : !cleanLabel(finalChoice) ? "Pick final choice" : "Publish"}
              >
                Publish Curioso Verdict
              </button>

              {!categoryClean ? (
                <div className="mt-2 text-xs font-semibold text-red-600">
                  Category is mandatory — add it above before publishing.
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
