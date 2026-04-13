"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

const CORAL_BG = "#fff7f7";
const CORAL_RING = "0 0 0 2px rgba(255,107,107,0.18) inset";

const ALLOWED = ["A", "B", "C", "D"];
const MAX_IMAGES = 4;
const BUCKET = "resolution-images";

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
  const entries = ALLOWED.map((L) => ({
    label: L,
    votes: Number(counts?.[L] || 0),
  }));
  entries.sort((a, b) => b.votes - a.votes);

  const top = entries[0];
  if (!top || top.votes <= 0) {
    return { label: "", isTie: false, tied: [] as string[] };
  }

  const tied = entries.filter((x) => x.votes === top.votes).map((x) => x.label);
  return { label: tied.length === 1 ? top.label : "", isTie: tied.length > 1, tied };
}

function pct(counts: any, totalVotes: number, label: string) {
  if (!totalVotes) return 0;
  return Math.round((Number(counts?.[label] || 0) / totalVotes) * 100);
}

async function shareOrCopy(url: string) {
  try {
    if (navigator?.share) {
      await navigator.share({ title: "Quandr3", url });
      return { ok: true, mode: "share" };
    }
  } catch {}

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, mode: "copy" };
  } catch {}

  return { ok: false, mode: "none" };
}

async function loadCurrentUserId() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const sid = sessionData?.session?.user?.id;
    if (sid) return String(sid);
  } catch {}

  try {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (uid) return String(uid);
  } catch {}

  return "";
}

function makeSafeFileName(name: string) {
  const cleaned = safeStr(name)
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || `image-${Date.now()}.jpg`;
}

export default function ResolveQuandr3Page() {
  const params = useParams();
  const id = (params || {})?.id ? String((params as any).id) : "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ A: 0, B: 0, C: 0, D: 0 });
  const [reasonsByLabel, setReasonsByLabel] = useState<any>({
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [finalChoice, setFinalChoice] = useState("");
  const [finalNote, setFinalNote] = useState("");

  const [category, setCategory] = useState("");
  const categoryClean = useMemo(() => safeStr(category).trim(), [category]);

  const [shareMsg, setShareMsg] = useState("");

  const [viewerId, setViewerId] = useState("");
  const [viewerReady, setViewerReady] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const totalVotes = useMemo(
    () => ALLOWED.reduce((sum, L) => sum + Number(counts?.[L] || 0), 0),
    [counts]
  );

  const internet = useMemo(() => computeInternetDecided(counts), [counts]);

  const curiosoFinal = useMemo(() => cleanLabel(q?.resolved_choice_label), [q]);
  const canPublish = useMemo(
    () =>
      !loading &&
      !uploading &&
      !!cleanLabel(finalChoice) &&
      !!categoryClean &&
      safeStr(q?.status).trim().toLowerCase() === "awaiting_user",
    [loading, uploading, finalChoice, categoryClean, q?.status]
  );

  const ownerId = useMemo(() => {
    return safeStr(q?.author_id || q?.user_id).trim().toLowerCase();
  }, [q?.author_id, q?.user_id]);

  const normalizedViewerId = useMemo(() => {
    return safeStr(viewerId).trim().toLowerCase();
  }, [viewerId]);

  const isOwner = useMemo(() => {
    return !!ownerId && !!normalizedViewerId && ownerId === normalizedViewerId;
  }, [ownerId, normalizedViewerId]);

  function optionText(label: string) {
    const L = cleanLabel(label);
    if (!L) return "";
    const row = (options || []).find((o) => cleanLabel(o?.label) === L);
    return safeStr(row?.text || row?.value).trim();
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
    const crowd = isCrowdWinner(label);
    const curioso = isCuriosoWinner(label);

    if (curioso && crowd) {
      return {
        border: `2px solid ${CORAL}`,
        bg: CORAL_BG,
        ring: CORAL_RING,
        badgeBg: CORAL,
        badgeFg: "white",
        badgeText: "INTERNET + CURIOUSO",
      };
    }

    if (curioso) {
      return {
        border: `2px solid ${CORAL}`,
        bg: CORAL_BG,
        ring: CORAL_RING,
        badgeBg: CORAL,
        badgeFg: "white",
        badgeText: "CURIOUSO VERDICT",
      };
    }

    if (crowd) {
      return {
        border: `2px solid ${CORAL}`,
        bg: CORAL_BG,
        ring: CORAL_RING,
        badgeBg: CORAL,
        badgeFg: "white",
        badgeText: internet.isTie ? "CROWD TIED" : "INTERNET DECIDED",
      };
    }

    return {
      border: "1px solid #e5e7eb",
      bg: "white",
      ring: "none",
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
      const uid = await loadCurrentUserId();
      setViewerId(uid);
      setViewerReady(true);

      const { data: qRow, error: qErr } = await supabase
        .from("quandr3s")
        .select(
          "id,title,prompt,context,category,status,author_id,user_id,created_at,closes_at,city,state,resolved_choice_label,resolved_at,resolution_note,resolution_image_urls"
        )
        .eq("id", id)
        .single();

      if (qErr) throw qErr;

      const { data: oRows } = await supabase
        .from("quandr3_options")
        .select("id,label,text,value,order")
        .eq("quandr3_id", id)
        .order("order", { ascending: true });

      const { data: choiceRows } = await supabase
        .from("quandr3_choices")
        .select("label,text")
        .eq("quandr3_id", id);

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
          text: safeStr(o?.text),
          value: safeStr(o?.value),
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

      setCategory(safeStr(qRow?.category || "").trim());
    } catch (e: any) {
      setErr(e?.message || "Failed to load resolve page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  useEffect(() => {
    const nextPreviews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  async function uploadImages() {
    if (!images.length) return [];

    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of images) {
        const safeName = makeSafeFileName(file.name);
        const filePath = `${id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

        if (data?.publicUrl) {
          urls.push(data.publicUrl);
        }
      }

      return urls;
    } finally {
      setUploading(false);
    }
  }

  async function submitResolution() {
    setShareMsg("");

    if (!viewerReady) {
      alert("Still checking your session. Try again.");
      return;
    }

    if (!isOwner) {
      alert("Only the Curioso can publish the final verdict.");
      return;
    }

    if (safeStr(q?.status).trim().toLowerCase() !== "awaiting_user") {
      alert("You can only resolve after voting has closed.");
      return;
    }

    const chosen = cleanLabel(finalChoice);

    if (!categoryClean) {
      alert("Category is required. Add a category first.");
      return;
    }

    if (!chosen) {
      alert("Pick a final choice (A–D)");
      return;
    }

    if (images.length > MAX_IMAGES) {
      alert(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const imageUrls = await uploadImages();

      const { error } = await supabase
        .from("quandr3s")
        .update({
          category: categoryClean,
          status: "resolved",
          resolved_choice_label: chosen,
          resolved_at: nowIso,
          resolution_note: finalNote,
          published_at: nowIso,
          resolution_image_urls: imageUrls,
        })
        .eq("id", id);

      if (error) throw error;

      try {
        localStorage.setItem("quandr3_explore_refresh", String(Date.now()));
      } catch {}

      window.location.assign(`/q/${id}/results`);
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
              href={`/q/${id}/results`}
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
            <div className="font-semibold text-red-600">{err}</div>
          ) : !q ? (
            <div>Not found.</div>
          ) : !isOwner ? (
            <div
              className="rounded-2xl border p-5"
              style={{ background: "#fff7f7", borderColor: "#fecaca" }}
            >
              <div className="text-lg font-extrabold" style={{ color: NAVY }}>
                This page is only for the Curioso.
              </div>
              <div className="mt-2 text-sm text-slate-700">
                You can view the Quandr3 and results, but only the original poster can publish the final verdict.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/q/${id}`}
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                  style={{ background: NAVY }}
                >
                  Back to Quandr3
                </Link>
                <Link
                  href={`/q/${id}/results`}
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                  style={{ background: CORAL }}
                >
                  View Results
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div
                className="mb-4 rounded-2xl border p-4"
                style={{ background: "#f8fafc" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                      CATEGORY (REQUIRED)
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      This must be set before publishing the Curioso Verdict.
                    </div>
                  </div>

                  {q?.city || q?.state ? (
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

              <div
                className="mt-6 rounded-2xl border p-4"
                style={{ borderColor: CORAL, background: CORAL_BG, boxShadow: CORAL_RING }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                    INTERNET DECIDED
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-extrabold"
                    style={{ background: CORAL, color: "white" }}
                  >
                    {internet.isTie ? "CROWD TIED" : "WINNER"}
                  </span>
                </div>

                {totalVotes === 0 ? (
                  <div className="mt-1 text-sm font-bold" style={{ color: NAVY }}>
                    No votes yet.
                  </div>
                ) : internet.isTie ? (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Crowd tie: <span style={{ color: CORAL }}>{internet.tied.join(" / ")}</span>{" "}
                    <span className="font-semibold text-slate-500">
                      ({totalVotes} total votes)
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                    Top voted: <span style={{ color: CORAL }}>{internet.label}</span>{" "}
                    <span className="font-semibold text-slate-500">
                      ({Number(counts?.[internet.label] || 0)} votes • {pct(counts, totalVotes, internet.label)}% • {totalVotes} total)
                    </span>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-600">
                  The Internet has weighed in. Now it’s your decision.
                </div>
              </div>

              <div
                className="mt-4 rounded-2xl border p-4"
                style={{
                  borderColor: curiosoFinal ? CORAL : "#e5e7eb",
                  background: curiosoFinal ? CORAL_BG : "white",
                  boxShadow: curiosoFinal ? CORAL_RING : "none",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                    CURIOUSO VERDICT
                  </div>
                  {q?.resolved_at ? (
                    <div className="text-xs text-slate-500">Resolved: {fmt(q.resolved_at)}</div>
                  ) : (
                    <div className="text-xs text-slate-500">Not resolved yet</div>
                  )}
                </div>

                {curiosoFinal ? (
                  <>
                    <div className="mt-1 text-sm font-extrabold" style={{ color: NAVY }}>
                      Final decision: <span style={{ color: CORAL }}>{curiosoFinal}</span>
                    </div>

                    <div className="mt-2 text-sm font-semibold" style={{ color: NAVY }}>
                      {optionText(curiosoFinal) ? optionText(curiosoFinal) : ""}
                    </div>

                    {q?.resolution_note ? (
                      <div className="mt-2 text-sm text-slate-700">{q.resolution_note}</div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">(No final note provided.)</div>
                    )}
                  </>
                ) : (
                  <div className="mt-2 text-sm text-slate-700">
                    Choose your final decision below, then publish your verdict.
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ALLOWED.map((L) => {
                  const styles = winnerStyles(L);
                  const votes = Number(counts?.[L] || 0);
                  const percent = pct(counts, totalVotes, L);

                  return (
                    <div
                      key={L}
                      className="rounded-2xl p-4"
                      style={{
                        border: styles.border,
                        background: styles.bg,
                        boxShadow: styles.ring === "none" ? "none" : styles.ring,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                            Option {L}
                          </div>

                          {optionText(L) ? (
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {optionText(L)}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-slate-500">
                              (No option text found)
                            </div>
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
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                          {(reasonsByLabel?.[L] || []).slice(0, 8).map((t: any, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      )}

                      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-bold">
                        <input
                          type="radio"
                          name="finalChoice"
                          value={L}
                          checked={finalChoice === L}
                          onChange={() => setFinalChoice(L)}
                        />
                        Select {L} as final decision
                      </label>
                    </div>
                  );
                })}
              </div>

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

              <div
                className="mt-6 rounded-2xl border p-4"
                style={{ background: "#fff7f7", borderColor: "rgba(255,107,107,0.28)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold"
                    style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}
                  >
                    📸
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                      Add visual proof (optional)
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Show what happened next. Upload up to {MAX_IMAGES} images from the outcome, result, or final situation.
                    </div>
                  </div>
                </div>

                <label
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition hover:bg-white"
                  style={{ borderColor: "rgba(255,107,107,0.35)", background: "#fff0f0" }}
                >
                  <div className="text-3xl">🖼️</div>
                  <div className="mt-2 text-sm font-extrabold" style={{ color: NAVY }}>
                    Click to add resolution images
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WEBP • up to {MAX_IMAGES} images
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e: any) => {
                      const files = Array.from(e.target.files || []) as File[];
                      setImages(files.slice(0, MAX_IMAGES));
                    }}
                    className="hidden"
                  />
                </label>

                {imagePreviews.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {imagePreviews.map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                        style={{ borderColor: "rgba(255,107,107,0.18)" }}
                      >
                        <img
                          src={src}
                          alt={`Resolution preview ${i + 1}`}
                          className="h-32 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <div className="min-w-0 truncate text-xs text-slate-600">
                            {images[i]?.name || `Image ${i + 1}`}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setImages((prev) => prev.filter((_, idx) => idx !== i));
                            }}
                            className="shrink-0 rounded-full px-2 py-1 text-[11px] font-extrabold"
                            style={{
                              background: "rgba(255,107,107,0.12)",
                              color: CORAL,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={submitResolution}
                disabled={!canPublish}
                className="mt-6 rounded-full px-6 py-3 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-50"
                style={{ background: CORAL }}
                title={
                  loading
                    ? "Loading"
                    : uploading
                    ? "Uploading images"
                    : !categoryClean
                    ? "Category required"
                    : !cleanLabel(finalChoice)
                    ? "Pick final choice"
                    : safeStr(q?.status).trim().toLowerCase() !== "awaiting_user"
                    ? "Voting must be closed first"
                    : "Publish"
                }
              >
                {uploading ? "Uploading images..." : "Publish Curioso Verdict"}
              </button>

              {!categoryClean ? (
                <div className="mt-2 text-xs font-semibold text-red-600">
                  Category is mandatory — add it above before publishing.
                </div>
              ) : null}

              {safeStr(q?.status).trim().toLowerCase() !== "awaiting_user" ? (
                <div className="mt-2 text-xs font-semibold text-red-600">
                  You can only publish the Curioso Verdict after voting has closed and the Quandr3 reaches awaiting_user.
                </div>
              ) : null}

              <div className="mt-4 text-xs text-slate-500">
                Visual rule: <b style={{ color: CORAL }}>coral</b> highlights both the <b>Internet Winner</b> and the <b>Curioso Verdict</b>.
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}