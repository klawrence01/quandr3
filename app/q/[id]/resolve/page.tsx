"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type QRow = {
  id: string;
  title?: string;
  question?: string;
  prompt?: string;
  status?: "open" | "awaiting_user" | "resolved" | string;
  discussion_open?: boolean;
  created_by?: string;
  user_id?: string;
  author_id?: string;
  created_at?: string;
};

type OptionRow = {
  id?: string;
  text?: string;
  label?: string;
  title?: string;
  image_url?: string;
  image?: string;
  picked_index?: number;
  idx?: number;
  order_index?: number;
};

type VoteRow = {
  id?: string;
  quandr3_id?: string;
  q_id?: string;
  option_id?: string;
  picked_index?: number;
  created_at?: string;
};

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function pickQuestion(q: QRow) {
  return (
    safeStr(q.title) ||
    safeStr(q.question) ||
    safeStr(q.prompt) ||
    "Untitled Quandr3"
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Lightweight confetti (no dependencies).
 * Creates little paper squares that fall and fade.
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
        {
          transform: `translate(${drift}px, 110vh) rotate(${rotate}deg)`,
          opacity: 0.05,
        },
      ],
      { duration: fall, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    root.appendChild(p);

    // cleanup each piece
    window.setTimeout(() => {
      try {
        p.remove();
      } catch {}
    }, fall + 50);
  }

  // cleanup root
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

async function tryUpdate(
  table: string,
  match: Record<string, any>,
  patch: Record<string, any>
) {
  let q = supabase.from(table).update(patch);
  Object.keys(match).forEach((k) => (q = q.eq(k, match[k])));
  const { error } = await q;
  if (error) throw error;
}

async function tryInsert(table: string, row: Record<string, any>) {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
}

export default function ResolvePage() {
  const params = useParams();
  const router = useRouter();

  const id = safeStr((params as any)?.id);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [qrow, setQrow] = useState<QRow | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [counts, setCounts] = useState<number[]>([]);

  const [isCurioso, setIsCurioso] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [discussionOpen, setDiscussionOpen] = useState<boolean>(false);
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  const status = qrow?.status || "open";
  const canToggleDiscussion = status === "awaiting_user";

  const totalVotes = useMemo(
    () => (counts || []).reduce((a, b) => a + (b || 0), 0),
    [counts]
  );

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);
        setErrorMsg("");

        // auth
        setAuthLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!alive) return;
        setUserId(uid);
        setAuthLoading(false);

        // fetch quandr3 row (try common table names)
        let q: any = null;
        try {
          q = await trySelectOne("quandr3s", { id });
        } catch (e1) {
          // fallback for alternate naming
          try {
            q = await trySelectOne("quandrs", { id });
          } catch (e2) {
            throw e1;
          }
        }

        if (!alive) return;

        const qTyped: QRow = q || { id };
        setQrow(qTyped);
        setDiscussionOpen(!!qTyped.discussion_open);

        // Curioso guard: created_by / user_id / author_id
        const owner =
          safeStr(qTyped.created_by) ||
          safeStr(qTyped.user_id) ||
          safeStr(qTyped.author_id);

        const isOwner = !!uid && !!owner && uid === owner;
        setIsCurioso(isOwner);

        if (!isOwner) {
          // not authorized — send them back to the public detail page
          router.replace(`/q/${id}`);
          return;
        }

        // fetch options (try common table names)
        let opts: any[] = [];
        const optionTables = ["quandr3_options", "quandry_options", "options"];
        const matchKeys = [
          { quandr3_id: id },
          { q_id: id },
          { parent_id: id },
        ];

        let got = false;
        for (const t of optionTables) {
          for (const mk of matchKeys) {
            try {
              opts = await trySelectMany(t, mk, { col: "idx", asc: true });
              got = true;
              break;
            } catch {}
          }
          if (got) break;
        }

        // Normalize + stable ordering
        const normalized: OptionRow[] = (opts || []).map((o: any) => ({
          id: o.id,
          text: o.text ?? o.label ?? o.title ?? "",
          image_url: o.image_url ?? o.image ?? "",
          idx:
            typeof o.idx === "number"
              ? o.idx
              : typeof o.order_index === "number"
              ? o.order_index
              : typeof o.picked_index === "number"
              ? o.picked_index
              : undefined,
        }));

        normalized.sort((a, b) => (a.idx ?? 999) - (b.idx ?? 999));
        setOptions(normalized);

        // default selected index
        setSelectedIndex(0);

        // votes breakdown (try common table names/columns)
        let votes: any[] = [];
        const voteTables = ["votes", "quandr3_votes", "quandry_votes"];
        let votesGot = false;

        for (const vt of voteTables) {
          for (const mk of matchKeys) {
            try {
              votes = await trySelectMany(vt, mk, { col: "created_at", asc: true });
              votesGot = true;
              break;
            } catch {}
          }
          if (votesGot) break;
        }

        const c = new Array(Math.max(1, normalized.length)).fill(0);

        // If votes store picked_index
        for (const v of votes as VoteRow[]) {
          const pi =
            typeof (v as any).picked_index === "number"
              ? (v as any).picked_index
              : null;

          if (pi !== null && pi >= 0) {
            if (pi >= c.length) {
              // extend if needed
              while (c.length <= pi) c.push(0);
            }
            c[pi] += 1;
            continue;
          }

          // else option_id mapping
          const oid = safeStr((v as any).option_id);
          if (oid) {
            const idx = normalized.findIndex((o) => safeStr(o.id) === oid);
            if (idx >= 0) c[idx] += 1;
          }
        }

        setCounts(c);

        // If voting is closed and there is a clear winner, default selection to winner
        if (qTyped.status === "awaiting_user" || qTyped.status === "resolved") {
          let best = 0;
          for (let i = 1; i < c.length; i++) if (c[i] > c[best]) best = i;
          setSelectedIndex(best);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(
          safeStr(err?.message) ||
            "Something went wrong loading the resolve page."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) boot();

    return () => {
      alive = false;
    };
  }, [id, router]);

  async function toggleDiscussion(nextOpen: boolean) {
    if (!qrow) return;
    if (!canToggleDiscussion) return;

    setTogglingDiscussion(true);
    setErrorMsg("");

    try {
      await tryUpdate("quandr3s", { id: qrow.id }, { discussion_open: nextOpen });
      setDiscussionOpen(nextOpen);
      setQrow((prev) => (prev ? { ...prev, discussion_open: nextOpen } : prev));
    } catch (err1: any) {
      // fallback table name
      try {
        await tryUpdate("quandrs", { id: qrow.id }, { discussion_open: nextOpen });
        setDiscussionOpen(nextOpen);
        setQrow((prev) => (prev ? { ...prev, discussion_open: nextOpen } : prev));
      } catch (err2: any) {
        throw err1;
      }
    } finally {
      setTogglingDiscussion(false);
    }
  }

  async function lockDecision() {
    if (!qrow) return;

    setSaving(true);
    setErrorMsg("");

    try {
      // 1) write a resolution row (best-effort)
      const optionId = safeStr(options?.[selectedIndex]?.id);
      const payload: Record<string, any> = {
        quandr3_id: qrow.id,
        picked_index: selectedIndex,
        note: note?.trim() || null,
        resolved_at: new Date().toISOString(),
        resolver_user_id: userId || null,
      };

      if (optionId) payload.option_id = optionId;

      try {
        await tryInsert("quandr3_resolutions", payload);
      } catch (e1) {
        // fallback naming
        try {
          await tryInsert("quandry_resolutions", payload);
        } catch (e2) {
          // If this fails, we still proceed to set status to resolved (Phase 1 pragmatism)
          console.warn("Resolution insert failed, proceeding with status update.", e1);
        }
      }

      // 2) update quandr3s to resolved + close discussion
      const patch: Record<string, any> = {
        status: "resolved",
        discussion_open: false,
      };

      // optional: if your table has resolved_at, it will accept; if not, it will error.
      // We try it and fall back to just status/discussion_open.
      try {
        await tryUpdate(
          "quandr3s",
          { id: qrow.id },
          { ...patch, resolved_at: new Date().toISOString() }
        );
      } catch {
        try {
          await tryUpdate("quandr3s", { id: qrow.id }, patch);
        } catch (errA: any) {
          // fallback table name
          try {
            await tryUpdate(
              "quandrs",
              { id: qrow.id },
              { ...patch, resolved_at: new Date().toISOString() }
            );
          } catch {
            await tryUpdate("quandrs", { id: qrow.id }, patch);
          }
        }
      }

      // 3) confetti + redirect
      fireConfetti();
      window.setTimeout(() => {
        router.push(`/q/${qrow.id}/results`);
      }, 650);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        safeStr(err?.message) || "Could not lock decision. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Loading Resolve…
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Preparing the Curioso decision panel.
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If not Curioso, we redirect in effect — but render a minimal fallback
  if (!isCurioso) {
    return (
      <main className="min-h-screen" style={{ background: SOFT_BG }}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>
              Redirecting…
            </div>
            <div className="mt-2 text-sm text-slate-600">
              This page is only for the Curioso who created the Quandr3.
            </div>
            <div className="mt-4">
              <Link
                href={`/q/${id}`}
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: BLUE }}
              >
                Back to Quandr3
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              RESOLVE
            </div>
            <h1 className="mt-1 text-3xl font-extrabold" style={{ color: NAVY }}>
              Make the final call
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Voting is{" "}
              <span className="font-semibold" style={{ color: NAVY }}>
                {status === "open"
                  ? "still open"
                  : status === "awaiting_user"
                  ? "closed"
                  : "resolved"}
              </span>
              . Your decision closes the loop so everyone learns.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/q/${id}`}
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Back
            </Link>
            <Link
              href={`/q/${id}/results`}
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
              style={{ background: BLUE }}
            >
              View Results
            </Link>
          </div>
        </div>

        {errorMsg ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold tracking-widest text-slate-600">
            QUANDR3
          </div>
          <div className="mt-2 text-xl font-extrabold" style={{ color: NAVY }}>
            {qrow ? pickQuestion(qrow) : "Quandr3"}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background:
                  status === "resolved"
                    ? "rgba(0,169,165,0.12)"
                    : status === "awaiting_user"
                    ? "rgba(255,107,107,0.12)"
                    : "rgba(30,99,243,0.12)",
                color:
                  status === "resolved"
                    ? TEAL
                    : status === "awaiting_user"
                    ? CORAL
                    : BLUE,
              }}
            >
              Status: {status}
            </span>

            <span className="text-xs text-slate-600">
              Total votes:{" "}
              <span className="font-semibold" style={{ color: NAVY }}>
                {totalVotes}
              </span>
            </span>
          </div>
        </div>

        {/* Discussion controls */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-600">
                DISCUSSION
              </div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: NAVY }}>
                Optional deliberation
              </div>
              <div className="mt-1 text-sm text-slate-600">
                For Phase 1: discussion can be opened while{" "}
                <span className="font-semibold">awaiting_user</span> and will be{" "}
                <span className="font-semibold">auto-closed</span> when you resolve.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!canToggleDiscussion || togglingDiscussion}
                onClick={() => toggleDiscussion(true)}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                  discussionOpen ? "bg-slate-100 text-slate-400" : "text-white"
                )}
                style={!discussionOpen ? { background: TEAL } : {}}
                title={
                  canToggleDiscussion
                    ? ""
                    : "Discussion can only be toggled when voting is closed (awaiting_user)."
                }
              >
                Open Discussion
              </button>

              <button
                disabled={!canToggleDiscussion || togglingDiscussion}
                onClick={() => toggleDiscussion(false)}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                  !discussionOpen ? "bg-slate-100 text-slate-400" : "text-white"
                )}
                style={discussionOpen ? { background: CORAL } : {}}
                title={
                  canToggleDiscussion
                    ? ""
                    : "Discussion can only be toggled when voting is closed (awaiting_user)."
                }
              >
                Close Discussion
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            Current state:{" "}
            <span className="font-semibold" style={{ color: NAVY }}>
              {discussionOpen ? "OPEN" : "CLOSED"}
            </span>
            {canToggleDiscussion ? (
              <span className="ml-2 text-slate-500">
                (Only voters can participate; everyone else can view when public pages allow.)
              </span>
            ) : (
              <span className="ml-2 text-slate-500">
                (You’ll be able to toggle this when voting closes.)
              </span>
            )}
          </div>
        </div>

        {/* Vote breakdown + decision */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              STANDINGS PREVIEW
            </div>
            <div className="mt-1 text-lg font-extrabold" style={{ color: NAVY }}>
              How the community voted
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Visible to you now. Wayfinders see full breakdown after voting closes.
            </div>

            <div className="mt-5 space-y-3">
              {(options?.length ? options : new Array(4).fill(null)).map((o, idx) => {
                const label = o
                  ? safeStr(o.text) || `Option ${String.fromCharCode(65 + idx)}`
                  : `Option ${String.fromCharCode(65 + idx)}`;

                const c = counts?.[idx] || 0;
                const pct = totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0;

                const isLeading =
                  totalVotes > 0 && c === Math.max(...(counts || [0])) && c > 0;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: isLeading
                        ? "rgba(0,169,165,0.45)"
                        : "rgba(15,23,42,0.12)",
                      background: isLeading ? "rgba(0,169,165,0.06)" : "white",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold" style={{ color: NAVY }}>
                          {String.fromCharCode(65 + idx)}. {label}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {c} vote{c === 1 ? "" : "s"} • {pct}%
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {o?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={o.image_url}
                            alt=""
                            className="h-10 w-10 rounded-lg border object-cover"
                          />
                        ) : null}
                        {isLeading ? (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ background: "rgba(0,169,165,0.12)", color: TEAL }}
                          >
                            Leading
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isLeading ? TEAL : BLUE,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-widest text-slate-600">
              YOUR DECISION
            </div>
            <div className="mt-1 text-lg font-extrabold" style={{ color: NAVY }}>
              Choose the final outcome
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Default selects the current leader once voting is closed.
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {(options?.length ? options : new Array(4).fill(null)).map((o, idx) => {
                const label = o
                  ? safeStr(o.text) || `Option ${String.fromCharCode(65 + idx)}`
                  : `Option ${String.fromCharCode(65 + idx)}`;

                const selected = idx === selectedIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cx(
                      "rounded-xl border p-3 text-left shadow-sm transition",
                      selected ? "ring-2" : "hover:bg-slate-50"
                    )}
                    // ✅ FIX: remove invalid ringColor (not real CSS). Use boxShadow instead.
                    style={
                      selected
                        ? {
                            borderColor: "transparent",
                            boxShadow: `0 0 0 2px ${TEAL}`,
                          }
                        : { borderColor: "rgba(15,23,42,0.12)", boxShadow: "none" }
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold" style={{ color: NAVY }}>
                        {String.fromCharCode(65 + idx)}. {label}
                      </div>
                      {selected ? (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: "rgba(0,169,165,0.12)", color: TEAL }}
                        >
                          Selected
                        </span>
                      ) : null}
                    </div>
                    {o?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.image_url}
                        alt=""
                        className="mt-2 h-24 w-full rounded-lg border object-cover"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold tracking-widest text-slate-600">
                WHY I DECIDED THIS (OPTIONAL)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="Share your reasoning so everyone learns from your decision..."
                className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: "rgba(15,23,42,0.12)" }}
              />
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                On resolve: discussion auto-closes, status becomes{" "}
                <span className="font-semibold" style={{ color: NAVY }}>
                  resolved
                </span>
                , then we redirect to Results.
              </div>

              <button
                disabled={saving}
                onClick={lockDecision}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-sm"
                style={{ background: CORAL }}
              >
                {saving ? "Locking…" : "Lock Decision + Celebrate 🎉"}
              </button>
            </div>

            {status === "open" ? (
              <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                <span className="font-semibold" style={{ color: NAVY }}>
                  Note:
                </span>{" "}
                This Quandr3 is still open. You can resolve early, but the intended flow is:
                open → awaiting_user → resolved.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          Quandr3 • Ask • Share • Decide
        </div>
      </div>
    </main>
  );
}
