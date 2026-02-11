"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

// ✅ your actual path
import type { Quandr3Row } from "@/types/quandr3";
import { normalizeOptions } from "@/types/quandr3";


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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pickQuestion(q: any) {
  return (
    safeStr(q?.title) ||
    safeStr(q?.question) ||
    safeStr(q?.prompt) ||
    safeStr(q?.context) ||
    "Untitled Quandr3"
  );
}

// ✅ SAME thumbnail rules everywhere (detail + results)
function pickThumb(q: Quandr3Row) {
  if (q?.hero_image_url) return q.hero_image_url;
  if (q?.media_url) return q.media_url;

  const opts = normalizeOptions(q);
  const firstWithMedia = (opts || []).find((o) => o?.media_url);
  if (firstWithMedia?.media_url) return firstWithMedia.media_url;

  return null;
}

/**
 * Lightweight confetti (no dependencies).
 */
function fireConfetti() {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "9999";
  document.body.appendChild(root);

  const colors = [BLUE, TEAL, CORAL, NAVY, "#ffffff"];
  const count = 140;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 10;

    p.style.position = "absolute";
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `-20px`;
    p.style.width = `${size}px`;
    p.style.height = `${size * 0.6}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.opacity = "0.95";
    p.style.borderRadius = "2px";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";

    const fall = 1400 + Math.random() * 1200;
    const drift = (Math.random() - 0.5) * 260;
    const rotate = (Math.random() - 0.5) * 720;

    p.animate(
      [
        { transform: `translate(0px, 0px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${drift}px, 110vh) rotate(${rotate}deg)`, opacity: 0.05 },
      ],
      { duration: fall, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    root.appendChild(p);

    window.setTimeout(() => {
      try {
        p.remove();
      } catch {}
    }, fall + 50);
  }

  window.setTimeout(() => {
    try {
      root.remove();
    } catch {}
  }, 2800);
}

async function trySelectOne(table: string, match: Record<string, any>) {
  const keys = Object.keys(match);
  let q = supabase.from(table).select("*");
  keys.forEach((k) => (q = q.eq(k, match[k])));
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

async function trySelectMany(
  table: string,
  match: Record<string, any>,
  orderBy?: { col: string; asc?: boolean }
) {
  const keys = Object.keys(match);
  let q = supabase.from(table).select("*");
  keys.forEach((k) => (q = q.eq(k, match[k])));
  if (orderBy?.col) q = q.order(orderBy.col, { ascending: orderBy.asc ?? true });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function tryUpdate(table: string, match: Record<string, any>, patch: Record<string, any>) {
  let q = supabase.from(table).update(patch);
  Object.keys(match).forEach((k) => (q = q.eq(k, match[k])));
  const { error } = await q;
  if (error) throw error;
}

export default function ResolvePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = safeStr((params as any)?.id);

  // DEV-only preview (?dev=1)
  const devPreview = useMemo(() => {
    const flag = searchParams?.get("dev") === "1";
    return flag && process.env.NODE_ENV !== "production";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [qrow, setQrow] = useState<Quandr3Row | null>(null);

  const [options, setOptions] = useState<
    Array<{ label: string; text: string; media_url?: string | null; idx: number }>
  >([]);

  const [counts, setCounts] = useState<number[]>([]);
  const [isCurioso, setIsCurioso] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [discussionOpen, setDiscussionOpen] = useState<boolean>(false);
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  const status = qrow?.status || "open";

  const totalVotes = useMemo(
    () => (counts || []).reduce((a, b) => a + (b || 0), 0),
    [counts]
  );

  const thumb = useMemo(() => (qrow ? pickThumb(qrow) : null), [qrow]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!alive) return;
        setUserId(uid);

        if (!uid && !devPreview) {
          router.replace(`/login?next=/q/${id}/resolve`);
          return;
        }

        // fetch quandr3
        let q: any = null;
        try {
          q = await trySelectOne("quandr3s", { id });
        } catch {
          q = await trySelectOne("quandrs", { id });
        }

        if (!alive) return;

        const qTyped: Quandr3Row = (q || { id }) as any;
        setQrow(qTyped);
        setDiscussionOpen(!!qTyped?.discussion_open);

        const owner =
          safeStr((qTyped as any)?.created_by) ||
          safeStr((qTyped as any)?.user_id) ||
          safeStr((qTyped as any)?.author_id);

        const isOwner = !!uid && !!owner && uid === owner;
        setIsCurioso(isOwner || devPreview);

        if (!isOwner && !devPreview) {
          router.replace(`/q/${id}`);
          return;
        }

        // ✅ options: prefer JSON `options`, fallback to table
        const jsonOptions = normalizeOptions(qTyped);

        let normalized: Array<{ label: string; text: string; media_url?: string | null; idx: number }> = [];

        if (Array.isArray(jsonOptions) && jsonOptions.length) {
          normalized = jsonOptions.map((o: any, idx: number) => ({
            label: o?.label || ["A", "B", "C", "D"][idx] || "A",
            text: o?.text || "",
            media_url: o?.media_url ?? null,
            idx,
          }));
        } else {
          const opts = await trySelectMany("quandr3_options", { quandr3_id: id }, { col: "idx", asc: true });
          normalized = (opts || []).map((o: any) => ({
            label: o?.label || ["A", "B", "C", "D"][o?.idx ?? 0] || "A",
            text: o?.text ?? o?.title ?? "",
            media_url: o?.image_url ?? o?.image ?? null,
            idx: typeof o.idx === "number" ? o.idx : typeof o.order_index === "number" ? o.order_index : 0,
          }));
          normalized.sort((a, b) => (a.idx ?? 999) - (b.idx ?? 999));
        }

        setOptions(normalized);
        setSelectedIndex(0);

        // votes
        const votes = await trySelectMany("quandr3_votes", { quandr3_id: id }, { col: "created_at", asc: true });
        const c = new Array(Math.max(1, normalized.length)).fill(0);

        for (const v of votes as any[]) {
          const pi =
            typeof (v as any).choice_index === "number"
              ? (v as any).choice_index
              : typeof (v as any).picked_index === "number"
              ? (v as any).picked_index
              : null;

          if (pi !== null && pi >= 0) {
            while (c.length <= pi) c.push(0);
            c[pi] += 1;
          }
        }

        setCounts(c);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(safeStr(err?.message) || "Something went wrong loading the resolve page.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) boot();
    return () => {
      alive = false;
    };
  }, [id, router, devPreview]);

  async function handleToggleDiscussion() {
    if (!qrow) return;
    try {
      setTogglingDiscussion(true);
      const next = !discussionOpen;

      await tryUpdate("quandr3s", { id: qrow.id }, { discussion_open: next });
      setDiscussionOpen(next);
      setQrow((prev: any) => ({ ...(prev || {}), discussion_open: next }));
    } catch (e: any) {
      alert(safeStr(e?.message) || "Could not toggle discussion.");
    } finally {
      setTogglingDiscussion(false);
    }
  }

  async function handleResolve() {
    if (!qrow) return;

    try {
      setSaving(true);

      const picked = selectedIndex;
      const label = options?.[picked]?.label || ["A", "B", "C", "D"][picked] || "A";
      const choiceText = options?.[picked]?.text || "";

      await tryUpdate(
        "quandr3s",
        { id: qrow.id },
        {
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_choice_label: label,
          final_choice: choiceText,
          final_note: note || null,
        }
      );

      setQrow((prev: any) => ({
        ...(prev || {}),
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_choice_label: label,
        final_choice: choiceText,
        final_note: note || null,
      }));

      fireConfetti();

      window.setTimeout(() => {
        router.push(`/q/${id}`);
      }, 900);
    } catch (e: any) {
      alert(safeStr(e?.message) || "Could not save resolution.");
    } finally {
      setSaving(false);
    }
  }

  const title = qrow ? pickQuestion(qrow as any) : "Resolve";

  return (
    <div style={{ background: SOFT_BG, minHeight: "100vh" }}>
      {/* Top Bar */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 55%, ${TEAL} 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href={`/q/${id}`} className="text-white/90 hover:text-white font-semibold">
            ← Back
          </Link>

          <div className="text-white font-bold tracking-tight">Resolve</div>

          <div className="text-white/80 text-sm">
            {status === "resolved" ? "Resolved" : status === "awaiting_user" ? "Internet Decided" : "Open"}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {errorMsg ? (
          <div className="rounded-2xl p-4 mb-4 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="font-bold" style={{ color: NAVY }}>
              Problem loading
            </div>
            <div className="text-sm text-black/70 mt-1">{errorMsg}</div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="font-bold" style={{ color: NAVY }}>
              Loading…
            </div>
            <div className="text-sm text-black/60 mt-1">Pulling results and vote counts.</div>
          </div>
        ) : null}

        {!loading && qrow ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-3xl overflow-hidden border shadow-sm" style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}>
                {thumb ? (
                  <div className="w-full">
                    <img src={thumb} alt="Quandr3 thumbnail" className="w-full h-auto" />
                  </div>
                ) : null}

                <div className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: BLUE }}>
                    Results Preview
                  </div>

                  <h1 className="mt-2 text-2xl md:text-3xl font-extrabold" style={{ color: NAVY }}>
                    {title}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(30,99,243,0.10)", color: BLUE }}>
                      Total votes: {totalVotes}
                    </span>

                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(0,169,165,0.10)", color: TEAL }}>
                      Discussion: {discussionOpen ? "Open" : "Closed"}
                    </span>

                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(255,107,107,0.12)", color: CORAL }}>
                      Status: {status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(options || []).map((o, idx) => {
                      const c = counts?.[idx] || 0;
                      const pct = totalVotes ? Math.round((c / totalVotes) * 100) : 0;
                      const isPicked = idx === selectedIndex;

                      return (
                        <button
                          key={`${o.label}-${idx}`}
                          onClick={() => setSelectedIndex(idx)}
                          className={cx("w-full text-left rounded-2xl border p-4 transition", isPicked && "ring-2")}
                          style={{
                            background: isPicked ? "rgba(30,99,243,0.06)" : "white",
                            borderColor: isPicked ? "rgba(30,99,243,0.40)" : "rgba(0,0,0,0.08)",
                            boxShadow: isPicked ? "0 10px 30px rgba(30,99,243,0.10)" : "none",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-extrabold" style={{ color: NAVY }}>
                                {o.label}. {o.text || "Option"}
                              </div>

                              {o.media_url ? (
                                <div className="mt-2">
                                  <img
                                    src={o.media_url}
                                    alt={`${o.label} image`}
                                    className="w-full max-h-56 object-cover rounded-2xl border"
                                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-sm font-extrabold" style={{ color: BLUE }}>
                                {pct}%
                              </div>
                              <div className="text-xs text-black/60">{c} votes</div>
                            </div>
                          </div>

                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                            <div className="h-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold" style={{ color: NAVY }}>
                      Your final note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border p-3 outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                      placeholder="Why did you choose this outcome?"
                    />
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <button
                      onClick={handleResolve}
                      disabled={saving || status === "resolved"}
                      className="rounded-2xl px-5 py-3 font-extrabold text-white disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${CORAL} 0%, ${BLUE} 55%, ${TEAL} 100%)`,
                        boxShadow: "0 18px 40px rgba(11,35,67,0.18)",
                      }}
                    >
                      {status === "resolved" ? "Already Resolved" : saving ? "Saving…" : "Resolve Now"}
                    </button>

                    <button
                      onClick={handleToggleDiscussion}
                      disabled={togglingDiscussion}
                      className="rounded-2xl px-5 py-3 font-bold border"
                      style={{ borderColor: "rgba(0,0,0,0.10)", background: "white", color: NAVY }}
                    >
                      {togglingDiscussion ? "Updating…" : discussionOpen ? "Close Discussion" : "Open Discussion"}
                    </button>

                    <Link
                      href={`/q/${id}`}
                      className="rounded-2xl px-5 py-3 font-bold border text-center"
                      style={{ borderColor: "rgba(0,0,0,0.10)", background: "white", color: NAVY }}
                    >
                      View Detail
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-3xl border p-5" style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="font-extrabold" style={{ color: NAVY }}>
                  How this works
                </div>
                <div className="mt-2 text-sm text-black/70 leading-relaxed">
                  The internet voted. Now you choose the final outcome. Pick the option you’re going with, add a note if you want,
                  and hit <span className="font-bold">Resolve Now</span>.
                </div>

                <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(0,169,165,0.08)" }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                    Tip
                  </div>
                  <div className="mt-1 text-sm text-black/70">
                    If you want people to read the reasoning, keep discussion open after you resolve.
                  </div>
                </div>

                {!isCurioso && !devPreview ? (
                  <div className="mt-4 text-sm font-bold" style={{ color: CORAL }}>
                    You don’t own this Quandr3.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
