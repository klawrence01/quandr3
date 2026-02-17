// /app/q/create/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const CATEGORIES = ["Family", "Career", "Money", "Health", "Relationships", "School", "Faith", "Lifestyle"];

/* =========================
   Helpers
========================= */

function slugify(s = "") {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin || "";
}

async function shareUrl(url: string, title?: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title: title || "Quandr3", url });
      return true;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
    return true;
  } catch {
    try {
      prompt("Copy this link:", url);
      return true;
    } catch {}
  }
  return false;
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
    return true;
  } catch {
    try {
      prompt("Copy this link:", url);
      return true;
    } catch {}
  }
  return false;
}

/* =========================
   Page
========================= */

export default function CreateQuandr3Page() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // success signal
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const canPublish = useMemo(() => {
    return Boolean(title?.trim() && prompt?.trim() && optA?.trim() && optB?.trim());
  }, [title, prompt, optA, optB]);

  const publishedUrl = useMemo(() => {
    if (!publishedId) return "";
    const origin = getOrigin();
    return origin ? `${origin}/q/${publishedId}` : `/q/${publishedId}`;
  }, [publishedId]);

  async function handleCreate() {
    setError(null);
    setPublishedId(null);
    setPublishedAt(null);

    if (!canPublish) {
      setError("Title, prompt, and at least options A & B are required.");
      return;
    }

    setIsSaving(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const uid = userRes?.user?.id;
      if (!uid) {
        setError("You must be signed in to publish.");
        setIsSaving(false);
        return;
      }

      const payload = {
        title: title.trim(),
        prompt: prompt.trim(),
        category,
        slug: slugify(title.trim()),
        status: "open",
        author_id: uid,
      };

      const { data: q, error: qErr } = await supabase
        .from("quandr3s")
        .insert(payload)
        .select("id, created_at")
        .single();

      if (qErr) throw qErr;
      if (!q?.id) throw new Error("Create succeeded but returned no id.");

      const options = [
        { label: "A", text: optA.trim() },
        { label: "B", text: optB.trim() },
        optC?.trim() ? { label: "C", text: optC.trim() } : null,
        optD?.trim() ? { label: "D", text: optD.trim() } : null,
      ].filter(Boolean) as Array<{ label: string; text: string }>;

      const { error: optErr } = await supabase.from("quandr3_options").insert(
        options.map((o) => ({
          quandr3_id: q.id,
          label: o.label,
          value: o.text, // REQUIRED (NOT NULL)
          text: o.text, // safe if exists
        }))
      );
      if (optErr) throw optErr;

      // ✅ SIGNAL: tell Explore to refresh (same-tab safe)
      try {
        localStorage.setItem("quandr3_explore_refresh", String(Date.now()));
      } catch {}

      setPublishedId(q.id);
      setPublishedAt(q.created_at || null);

      setTimeout(() => {
        router.push(`/q/${q.id}`);
      }, 650);
    } catch (e: any) {
      console.error("Create failed:", e);
      const msg = e?.message || "Failed to create Quandr3";
      if (String(msg).toLowerCase().includes("row-level security")) {
        setError(
          "Blocked by security policy (RLS). Make sure you're signed in, and that your INSERT policy allows auth.uid() = author_id (and options insert is allowed)."
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================
     Preview UI
  ========================= */

  if (previewMode) {
    return (
      <main className="min-h-screen p-6" style={{ background: SOFT_BG }}>
        <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">{title || "Untitled Quandr3"}</h1>
          <p className="text-gray-700 mb-4">{prompt || "No prompt yet..."}</p>

          <div className="space-y-2">
            {optA && <div className="border p-3 rounded">A. {optA}</div>}
            {optB && <div className="border p-3 rounded">B. {optB}</div>}
            {optC && <div className="border p-3 rounded">C. {optC}</div>}
            {optD && <div className="border p-3 rounded">D. {optD}</div>}
          </div>

          {error && <div className="text-red-600 mt-4 text-sm">{error}</div>}

          {publishedId && (
            <div className="mt-4 text-sm rounded-lg p-3" style={{ background: "#e9fff7", border: `1px solid ${TEAL}` }}>
              <div className="font-bold" style={{ color: NAVY }}>
                Published ✅
              </div>
              <div className="mt-1" style={{ color: NAVY, opacity: 0.9 }}>
                Your Quandr3 is live{" "}
                <span style={{ opacity: 0.7 }}>
                  {publishedAt ? `(${new Date(publishedAt).toLocaleString()})` : ""}
                </span>
              </div>

              {/* ✅ Share tools (Phase 1) */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(publishedUrl)}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                  style={{ background: NAVY }}
                  disabled={!publishedUrl}
                >
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => shareUrl(publishedUrl, title || "Quandr3")}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                  style={{ background: BLUE }}
                  disabled={!publishedUrl}
                >
                  Share
                </button>
                <Link href={`/q/${publishedId}`} className="text-xs font-extrabold" style={{ color: BLUE }}>
                  View →
                </Link>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setPreviewMode(false)} className="px-4 py-2 rounded bg-gray-200">
              Back to Edit
            </button>

            <button
              disabled={isSaving}
              onClick={handleCreate}
              className="px-4 py-2 rounded text-white"
              style={{ background: BLUE, opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? "Publishing..." : "Publish"}
            </button>
          </div>

          <div className="mt-3 text-xs" style={{ color: NAVY, opacity: 0.65 }}>
            Tip: Publish shows a confirmation immediately, then redirects you to the live page.
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     Edit UI
  ========================= */

  return (
    <main className="min-h-screen p-6" style={{ background: SOFT_BG }}>
      <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Create a Quandr3</h1>

        {publishedId && (
          <div className="mb-4 text-sm rounded-lg p-3" style={{ background: "#e9fff7", border: `1px solid ${TEAL}` }}>
            <div className="font-bold" style={{ color: NAVY }}>
              Published ✅
            </div>
            <div className="mt-1" style={{ color: NAVY, opacity: 0.9 }}>
              Your Quandr3 is live.
            </div>

            {/* ✅ Share tools (Phase 1) */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyUrl(publishedUrl)}
                className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                style={{ background: NAVY }}
                disabled={!publishedUrl}
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => shareUrl(publishedUrl, title || "Quandr3")}
                className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-95"
                style={{ background: BLUE }}
                disabled={!publishedUrl}
              >
                Share
              </button>
              <Link href={`/q/${publishedId}`} className="text-xs font-extrabold" style={{ color: BLUE }}>
                View →
              </Link>
            </div>
          </div>
        )}

        <input className="w-full border p-2 rounded mb-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <textarea
          className="w-full border p-2 rounded mb-3"
          placeholder="Describe the dilemma..."
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <select className="w-full border p-2 rounded mb-3" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input className="w-full border p-2 rounded mb-2" placeholder="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} />
        <input className="w-full border p-2 rounded mb-2" placeholder="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} />
        <input className="w-full border p-2 rounded mb-2" placeholder="Option C (optional)" value={optC} onChange={(e) => setOptC(e.target.value)} />
        <input className="w-full border p-2 rounded mb-4" placeholder="Option D (optional)" value={optD} onChange={(e) => setOptD(e.target.value)} />

        {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

        <div className="flex gap-3">
          <button onClick={() => setPreviewMode(true)} className="px-4 py-2 rounded bg-gray-200">
            Preview
          </button>

          <button
            disabled={isSaving}
            onClick={handleCreate}
            className="px-4 py-2 rounded text-white"
            style={{ background: BLUE, opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? "Creating..." : "Create"}
          </button>
        </div>

        {!canPublish && (
          <div className="mt-3 text-xs" style={{ color: NAVY, opacity: 0.65 }}>
            Requires: Title + Prompt + Option A + Option B
          </div>
        )}

        <div className="mt-3 text-xs" style={{ color: NAVY, opacity: 0.65 }}>
          Note: Publishing requires you to be signed in (RLS protection).
        </div>
      </div>
    </main>
  );
}
