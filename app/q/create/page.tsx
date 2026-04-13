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

const CATEGORIES = [
  "Family",
  "Career",
  "Money",
  "Health",
  "Relationships",
  "School",
  "Faith",
  "Lifestyle",
];

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

function safeStr(x: any) {
  return (x ?? "").toString();
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
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user?.id) {
        setError("You must be signed in to publish.");
        return;
      }

      const userId = String(user.id);

      // Ensure a matching profile row exists before inserting into quandr3s.
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert({ id: userId }, { onConflict: "id" });

      if (profileErr) throw profileErr;

      const payload = {
        title: title.trim(),
        prompt: prompt.trim(),
        context: prompt.trim(),
        category: category.trim(),
        slug: slugify(title.trim()),
        status: "open",
        author_id: userId,
        user_id: userId,
      };

      const { data: q, error: qErr } = await supabase
        .from("quandr3s")
        .insert([payload])
        .select("id, created_at, author_id, user_id, status")
        .single();

      if (qErr) throw qErr;
      if (!q?.id) throw new Error("Create succeeded but returned no id.");

      const savedAuthorId = safeStr(q.author_id);
      const savedUserId = safeStr(q.user_id);

      if (savedAuthorId && savedAuthorId !== userId) {
        throw new Error("Ownership mismatch: saved author_id does not match signed-in user.");
      }

      if (savedUserId && savedUserId !== userId) {
        throw new Error("Ownership mismatch: saved user_id does not match signed-in user.");
      }

      const options = [
        { label: "A", text: optA.trim(), order: 1 },
        { label: "B", text: optB.trim(), order: 2 },
        optC?.trim() ? { label: "C", text: optC.trim(), order: 3 } : null,
        optD?.trim() ? { label: "D", text: optD.trim(), order: 4 } : null,
      ].filter(Boolean) as Array<{ label: string; text: string; order: number }>;

      const { error: optErr } = await supabase.from("quandr3_options").insert(
        options.map((o) => ({
          quandr3_id: q.id,
          label: o.label,
          value: o.text,
          text: o.text,
          order: o.order,
        }))
      );

      if (optErr) throw optErr;

      try {
        localStorage.setItem("quandr3_explore_refresh", String(Date.now()));
      } catch {}

      setPublishedId(q.id);
      setPublishedAt(q.created_at || null);

      // Give the UI a brief success moment, then do a hard redirect.
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign(`/q/${q.id}`);
        } else {
          router.replace(`/q/${q.id}`);
          router.refresh();
        }
      }, 1200);
    } catch (e: any) {
      console.error("Create failed:", e);

      const msg = e?.message || "Failed to create Quandr3";

      if (String(msg).toLowerCase().includes("foreign key")) {
        setError(
          "Profile link failed. The signed-in user could not be matched to a profile record."
        );
      } else if (String(msg).toLowerCase().includes("row-level security")) {
        setError(
          "Blocked by security policy. Make sure you are signed in and allowed to create Quandr3s."
        );
      } else if (String(msg).toLowerCase().includes("ownership mismatch")) {
        setError(msg);
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
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-2xl font-bold">{title || "Untitled Quandr3"}</h1>
          <p className="mb-4 text-gray-700">{prompt || "No prompt yet..."}</p>

          <div className="space-y-2">
            {optA && <div className="rounded border p-3">A. {optA}</div>}
            {optB && <div className="rounded border p-3">B. {optB}</div>}
            {optC && <div className="rounded border p-3">C. {optC}</div>}
            {optD && <div className="rounded border p-3">D. {optD}</div>}
          </div>

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

          {publishedId && (
            <div
              className="mt-4 rounded-lg p-3 text-sm"
              style={{ background: "#e9fff7", border: `1px solid ${TEAL}` }}
            >
              <div className="font-bold" style={{ color: NAVY }}>
                Published ✅
              </div>
              <div className="mt-1" style={{ color: NAVY, opacity: 0.9 }}>
                Your Quandr3 is live{" "}
                <span style={{ opacity: 0.7 }}>
                  {publishedAt ? `(${new Date(publishedAt).toLocaleString()})` : ""}
                </span>
              </div>

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
                <Link
                  href={`/q/${publishedId}`}
                  className="text-xs font-extrabold"
                  style={{ color: BLUE }}
                >
                  View →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setPreviewMode(false)}
              className="rounded bg-gray-200 px-4 py-2"
            >
              Back to Edit
            </button>

            <button
              disabled={isSaving}
              onClick={handleCreate}
              className="rounded px-4 py-2 text-white"
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
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Create a Quandr3</h1>

        {publishedId && (
          <div
            className="mb-4 rounded-lg p-3 text-sm"
            style={{ background: "#e9fff7", border: `1px solid ${TEAL}` }}
          >
            <div className="font-bold" style={{ color: NAVY }}>
              Published ✅
            </div>
            <div className="mt-1" style={{ color: NAVY, opacity: 0.9 }}>
              Your Quandr3 is live.
            </div>

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
              <Link
                href={`/q/${publishedId}`}
                className="text-xs font-extrabold"
                style={{ color: BLUE }}
              >
                View →
              </Link>
            </div>
          </div>
        )}

        <input
          className="mb-3 w-full rounded border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="mb-3 w-full rounded border p-2"
          placeholder="Describe the dilemma..."
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <select
          className="mb-3 w-full rounded border p-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Option A"
          value={optA}
          onChange={(e) => setOptA(e.target.value)}
        />
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Option B"
          value={optB}
          onChange={(e) => setOptB(e.target.value)}
        />
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Option C (optional)"
          value={optC}
          onChange={(e) => setOptC(e.target.value)}
        />
        <input
          className="mb-4 w-full rounded border p-2"
          placeholder="Option D (optional)"
          value={optD}
          onChange={(e) => setOptD(e.target.value)}
        />

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button onClick={() => setPreviewMode(true)} className="rounded bg-gray-200 px-4 py-2">
            Preview
          </button>

          <button
            disabled={isSaving}
            onClick={handleCreate}
            className="rounded px-4 py-2 text-white"
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
          Note: Publishing requires you to be signed in.
        </div>
      </div>
    </main>
  );
}