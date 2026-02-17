// /app/create/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any, max = 120) {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

// ✅ helper to bump explore refresh (single source of truth)
function bumpExploreRefresh() {
  try {
    const stamp = String(Date.now());
    localStorage.setItem("quandr3_explore_refresh", stamp);
    // extra explicit flag (helps if you later decide to listen for it)
    localStorage.setItem("quandr3_explore_refresh_force", stamp);
  } catch {}
}

export default function CreateInviteLandingPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = useMemo(() => safeStr((params as any)?.id), [params]);
  const [savedRef, setSavedRef] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    try {
      // Save invite/ref code for Phase 1 referral tracking
      if (rawId) {
        localStorage.setItem("quandr3_ref", rawId);

        // ✅ NEW: also keep a "pending" copy (more reliable across flows)
        localStorage.setItem("quandr3_ref_pending", rawId);

        // ✅ signal Explore to refresh
        bumpExploreRefresh();

        setSavedRef(rawId);
        setMsg("Invite saved. You’re one tap away from creating your Quandr3.");
      } else {
        setSavedRef("");
        setMsg("No invite code detected. You can still create a Quandr3.");
      }
    } catch {
      setSavedRef(rawId || "");
      setMsg("We couldn’t store the invite code, but you can still continue.");
    }
  }, [rawId]);

  function handleContinue() {
    bumpExploreRefresh();
    router.push("/q/create");
  }

  function handleClearInvite() {
    try {
      localStorage.removeItem("quandr3_ref");
      localStorage.removeItem("quandr3_ref_pending");
      bumpExploreRefresh();
    } catch {}
    setSavedRef("");
    setMsg("Invite cleared. You can still create a Quandr3.");
  }

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top strip */}
      <div className="w-full border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold tracking-wide text-slate-600">
              <span style={{ color: BLUE }}>QUANDR3</span> · INVITE LINK
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/explore"
                onClick={() => bumpExploreRefresh()}
                className="rounded-full border px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Explore
              </Link>
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-white hover:opacity-95"
                style={{ background: NAVY }}
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 pt-12">
        <div
          className="rounded-3xl p-6 shadow-sm md:p-10"
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 55%, ${TEAL} 100%)`,
            color: "white",
          }}
        >
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              You’re invited
              <span className="ml-2 inline-block h-2 w-2 rounded-full" style={{ background: CORAL }} />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              Create your next Quandr3.
            </h1>

            <p className="mt-4 text-base text-white/90 md:text-lg">
              Real people. Real dilemmas. You ask a clear question, people vote A–D, and you get the{" "}
              <span className="font-extrabold">why</span> behind the choice.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-2xl px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                style={{ background: CORAL }}
              >
                Continue to Create
              </button>

              <button
                type="button"
                onClick={() => {
                  bumpExploreRefresh();
                  router.push("/q/create");
                }}
                className="rounded-2xl border px-6 py-3 text-sm font-extrabold text-white/95 hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.35)" }}
              >
                Skip & Create Anyway
              </button>
            </div>

            <div className="mt-5 text-xs text-white/70">
              Quandr3: <span className="font-semibold">Ask.</span> <span className="font-semibold">Share.</span>{" "}
              <span className="font-semibold">Decide.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Invite card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm md:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                  Invite details
                </div>
                <div className="mt-1 text-sm text-slate-700">{msg}</div>
              </div>

              {savedRef ? (
                <button
                  type="button"
                  onClick={handleClearInvite}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-bold tracking-wide text-slate-600">SAVED INVITE CODE</div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-slate-900">
                  {savedRef || "—"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (savedRef) navigator.clipboard.writeText(savedRef);
                        setMsg(savedRef ? "Copied invite code." : msg);
                      } catch {}
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                    style={{ background: BLUE }}
                    disabled={!savedRef}
                  >
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={handleContinue}
                    className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                    style={{ background: TEAL }}
                  >
                    Create Now
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600">
                This code helps us track invitations (Phase 1). No rewards are applied yet—just tracking.
              </div>
            </div>

            {/* Mini steps */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { title: "1) Ask", text: "Make the question tight and specific.", color: BLUE },
                { title: "2) Share", text: "People vote A–D and explain why.", color: TEAL },
                { title: "3) Decide", text: "You resolve with clarity and confidence.", color: CORAL },
              ].map((s) => (
                <div key={s.title} className="rounded-2xl border p-4">
                  <div className="text-xs font-extrabold" style={{ color: s.color }}>
                    {s.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Ready?
            </div>
            <div className="mt-2 text-sm text-slate-700">Jump into the Create screen and post your Quandr3.</div>

            <button
              type="button"
              onClick={handleContinue}
              className="mt-5 w-full rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
              style={{ background: BLUE }}
            >
              Continue to Create
            </button>

            <div className="mt-4 text-xs text-slate-500">
              You can add images for your options (A–D) right on the Create page.
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          If this link was shared by a friend, your invite code is now stored on this device for tracking.
        </div>
      </div>
    </main>
  );
}
