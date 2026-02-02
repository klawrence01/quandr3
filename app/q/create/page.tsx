// app/q/create/page.tsx
"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase/browser";

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
  "Life",
  "Faith",
  "Travel",
  "Food",
  "Tech",
  "Cars",
];

const DURATIONS = [
  { label: "6 hours", value: 6 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "72 hours", value: 72 },
];

// ---- helpers
function clampStr(v: any, max = 240) {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}
function uid(prefix = "q") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
function isImageFile(file?: File | null) {
  if (!file) return false;
  return file.type?.startsWith("image/");
}
function fmtBytes(bytes: number) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Supabase Storage upload
 * Bucket: "quandr3-media" ✅ (confirmed)
 * IMPORTANT: Storage policy expects path to start with the user's id folder:
 *   ${user.id}/quandr3/<filename>
 */
async function uploadToSupabaseStorage(
  file: File,
  path: string
): Promise<{ url?: string; error?: any }> {
  try {
    // ✅ FIX: use the real bucket name you found in storage.buckets
    const bucket = "quandr3-media";

    const upload = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type, // helpful for correct mime type
    });

    if (upload.error) return { error: upload.error };

    // Bucket is public -> use public URL
    const pub = supabase.storage.from(bucket).getPublicUrl(path);
    const url = pub?.data?.publicUrl;
    return { url };
  } catch (e) {
    return { error: e };
  }
}

export default function CreateQuandr3Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("Family");
  const [durationHours, setDurationHours] = useState<number>(24);

  const [question, setQuestion] = useState(
    "Looking for a car for a family of 4. We are a modest family, kids play sports"
  );
  const [context, setContext] = useState(
    "We often have friends and other children with us. We are considering a 3 row vehicle or possibly even a small van."
  );

  const [city, setCity] = useState("New Haven");
  const [country, setCountry] = useState("USA");

  const [options, setOptions] = useState<string[]>([
    "3-row SUV (used) — practical + space",
    "Minivan (used) — max space + convenience",
    "Midsize SUV — simpler + cheaper",
    "Wagon / crossover — best MPG + cargo",
  ]);

  const [showD, setShowD] = useState(true);

  // -----------------------
  // IMAGE STATE
  // -----------------------
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");

  const [optImageFiles, setOptImageFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [optImagePreviews, setOptImagePreviews] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        if (mainImagePreview?.startsWith("blob:"))
          URL.revokeObjectURL(mainImagePreview);
        optImagePreviews.forEach((p) => {
          if (p?.startsWith("blob:")) URL.revokeObjectURL(p);
        });
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = useMemo(() => {
    const qOk = clampStr(question, 140).length >= 8;
    const optList = options
      .slice(0, showD ? 4 : 3)
      .map((o) => clampStr(o, 80))
      .filter(Boolean);

    const optsOk = optList.length >= 2;
    return qOk && optsOk && !loading;
  }, [question, options, showD, loading]);

  function setOption(i: number, v: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function removeD() {
    setShowD(false);
    clearOptionImage(3);
    setOptions((prev) => {
      const next = [...prev];
      while (next.length < 4) next.push("");
      next[3] = "";
      return next;
    });
  }

  function addD() {
    setShowD(true);
    setOptions((prev) => {
      const next = [...prev];
      while (next.length < 4) next.push("");
      if (!next[3]) next[3] = "Option D...";
      return next;
    });
  }

  // -----------------------
  // IMAGE HANDLERS
  // -----------------------
  function onPickMainImage(file: File | null) {
    setStatusMsg(null);
    if (!file) return;

    if (!isImageFile(file)) {
      setStatusMsg("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatusMsg(
        `That image is too large (${fmtBytes(file.size)}). Try under 8MB.`
      );
      return;
    }

    try {
      if (mainImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(mainImagePreview);
    } catch {}

    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  }

  function clearMainImage() {
    try {
      if (mainImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(mainImagePreview);
    } catch {}
    setMainImageFile(null);
    setMainImagePreview("");
  }

  function onPickOptionImage(idx: number, file: File | null) {
    setStatusMsg(null);
    if (!file) return;

    if (!isImageFile(file)) {
      setStatusMsg("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setStatusMsg(
        `That option image is too large (${fmtBytes(file.size)}). Try under 6MB.`
      );
      return;
    }

    setOptImageFiles((prev) => {
      const next = [...prev];
      next[idx] = file;
      return next;
    });

    setOptImagePreviews((prev) => {
      const next = [...prev];
      try {
        if (next[idx]?.startsWith("blob:")) URL.revokeObjectURL(next[idx]);
      } catch {}
      next[idx] = URL.createObjectURL(file);
      return next;
    });
  }

  function clearOptionImage(idx: number) {
    setOptImageFiles((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });

    setOptImagePreviews((prev) => {
      const next = [...prev];
      try {
        if (next[idx]?.startsWith("blob:")) URL.revokeObjectURL(next[idx]);
      } catch {}
      next[idx] = "";
      return next;
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    setLoading(true);
    setStatusMsg(null);

    // Map UI fields -> DB schema
    const cleanTitle = clampStr(question, 140); // DB: title
    const cleanContext = clampStr(context, 500); // DB: context
    const cleanCategory = clampStr(category, 40) || "General";
    const cleanCity = clampStr(city, 60);
    const cleanCountry = clampStr(country, 40);

    const cleanOptions = options
      .slice(0, showD ? 4 : 3)
      .map((o) => clampStr(o, 80))
      .filter(Boolean);

    // Always store 4 positions for consistency
    let optionMediaUrls: string[] = ["", "", "", ""];

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes?.user;
      if (!user?.id) {
        setStatusMsg("Please log in to create a Quandr3.");
        router.push("/login");
        return;
      }

      // Upload main image (if any)
      let mainMediaUrl = "";

      if (mainImageFile) {
        const safeName = mainImageFile.name.replace(/\s+/g, "_");
        const path = `${user.id}/quandr3/${uid("main")}-${safeName}`;
        const up = await uploadToSupabaseStorage(mainImageFile, path);
        if (up?.error) throw up.error;
        if (up?.url) mainMediaUrl = up.url;
      }

      // Upload option images (A-D)
      for (let i = 0; i < 4; i++) {
        if (i === 3 && !showD) {
          optionMediaUrls[3] = "";
          continue;
        }
        const f = optImageFiles[i];
        if (!f) continue;

        const safeName = f.name.replace(/\s+/g, "_");
        const path = `${user.id}/quandr3/${uid(`opt${i}`)}-${safeName}`;
        const up = await uploadToSupabaseStorage(f, path);
        if (up?.error) throw up.error;
        if (up?.url) optionMediaUrls[i] = up.url;
      }

      // Insert row in quandr3s
      const qPayload: any = {
        author_id: user.id,
        category: cleanCategory,
        title: cleanTitle,
        context: cleanContext || null,

        media_url: mainMediaUrl || null,
        media_type: mainMediaUrl ? "image" : null,

        option_media_urls: optionMediaUrls, // requires column
        options: cleanOptions,

        city: cleanCity || null,
        country: cleanCountry || null,

        voting_duration_hours: durationHours,
        status: "open",
      };

      // ✅ .single() prevents the “no rows found” behavior
      const insertQ = await supabase
        .from("quandr3s")
        .insert(qPayload)
        .select("id")
        .single();

      if (insertQ.error) throw insertQ.error;

      const qId = insertQ?.data?.id;

      setStatusMsg("Created! Sending you to your Quandr3...");
      router.push(`/q/${qId}`);
      return;
    } catch (e: any) {
      console.error(e);
      setStatusMsg(
        e?.message
          ? `Could not create Quandr3: ${e.message}`
          : "Could not create Quandr3. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: SOFT_BG }}>
      {/* Top strip */}
      <div className="w-full border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold tracking-wide text-slate-600">
              <span style={{ color: BLUE }}>QUANDR3</span> · CREATE A NEW QUANDR3
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/explore"
                className="rounded-full border px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Back to Explore
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

      {/* Header */}
      <div className="mx-auto max-w-5xl px-4 pt-10">
        <h1
          className="text-3xl font-extrabold leading-tight md:text-4xl"
          style={{ color: NAVY }}
        >
          What do you need help deciding?
        </h1>

        <p className="mt-3 max-w-3xl text-base text-slate-700 md:text-lg">
          Keep it real, keep it specific. People will choose{" "}
          <span className="font-semibold">A, B, C</span> — or{" "}
          <span className="font-semibold">D</span> — and explain why they picked
          it. You get fresh perspective, not noise.
        </p>
      </div>

      {/* MAIN IMAGE */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                Add an image (optional)
              </div>
              <div className="text-xs text-slate-600">
                This is the main image for your Quandr3.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mainImagePreview ? (
                <button
                  type="button"
                  onClick={clearMainImage}
                  className="rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                >
                  Remove
                </button>
              ) : null}

              <label
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                style={{ background: BLUE }}
              >
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickMainImage(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div className="mt-4">
            {mainImagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border">
                <Image
                  src={mainImagePreview}
                  alt="Quandr3 main preview"
                  width={1400}
                  height={700}
                  className="h-[220px] w-full object-cover md:h-[300px]"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded-2xl border bg-slate-50 text-sm text-slate-500 md:h-[220px]">
                No image selected (optional)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="p-5 md:p-8">
            {statusMsg && (
              <div className="mb-6 rounded-xl border px-4 py-3 text-sm text-slate-800">
                {statusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Category */}
              <div>
                <label className="text-xs font-bold tracking-wide text-slate-700">
                  CATEGORY <span style={{ color: CORAL }}>*</span>
                </label>
                <select
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                  style={{ borderColor: "#d8deea" }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-bold tracking-wide text-slate-700">
                  HOW LONG SHOULD VOTING STAY OPEN?
                </label>
                <select
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                  style={{ borderColor: "#d8deea" }}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question */}
            <div className="mt-6">
              <label className="text-xs font-bold tracking-wide text-slate-700">
                YOUR QUESTION <span style={{ color: CORAL }}>*</span>
              </label>
              <input
                className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                style={{ borderColor: "#d8deea" }}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What decision are you trying to make?"
                maxLength={140}
              />
              <div className="mt-2 text-xs text-slate-500">
                {clampStr(question, 140).length}/140
              </div>
            </div>

            {/* Context */}
            <div className="mt-6">
              <label className="text-xs font-bold tracking-wide text-slate-700">
                CONTEXT (OPTIONAL, BUT HELPFUL)
              </label>
              <textarea
                className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                style={{ borderColor: "#d8deea" }}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any details that help people give better advice?"
                rows={4}
                maxLength={500}
              />
              <div className="mt-2 text-xs text-slate-500">
                {clampStr(context, 500).length}/500
              </div>
            </div>

            {/* Options */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                    Answer Options
                  </div>
                  <div className="text-xs text-slate-600">
                    Add a label and (optionally) a small image for each choice.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => (showD ? removeD() : addD())}
                  className="rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                >
                  {showD ? "Use A–C Only" : "Add Option D"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {["A", "B", "C", "D"].map((letter, idx) => {
                  if (letter === "D" && !showD) return null;

                  const badgeBg =
                    letter === "A"
                      ? BLUE
                      : letter === "B"
                      ? TEAL
                      : letter === "C"
                      ? NAVY
                      : CORAL;

                  return (
                    <div key={letter} className="rounded-2xl border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs font-bold tracking-wide text-slate-700">
                          OPTION{" "}
                          <span
                            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
                            style={{ background: badgeBg }}
                          >
                            {letter}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {optImagePreviews[idx] ? (
                            <button
                              type="button"
                              onClick={() => clearOptionImage(idx)}
                              className="rounded-full border px-3 py-1 text-xs font-semibold hover:bg-slate-50"
                            >
                              Remove image
                            </button>
                          ) : null}

                          <label
                            className="cursor-pointer rounded-full px-3 py-1 text-xs font-extrabold text-white hover:opacity-95"
                            style={{ background: badgeBg }}
                          >
                            Add image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                onPickOptionImage(
                                  idx,
                                  e.target.files?.[0] ?? null
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <input
                        className="w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                        style={{ borderColor: "#d8deea" }}
                        value={options[idx] ?? ""}
                        onChange={(e) => setOption(idx, e.target.value)}
                        placeholder={`Type option ${letter}...`}
                        maxLength={80}
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        {clampStr(options[idx] ?? "", 80).length}/80
                      </div>

                      <div className="mt-3">
                        {optImagePreviews[idx] ? (
                          <div className="relative overflow-hidden rounded-xl border">
                            <Image
                              src={optImagePreviews[idx]}
                              alt={`Option ${letter} preview`}
                              width={900}
                              height={450}
                              className="h-[120px] w-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-[120px] items-center justify-center rounded-xl border bg-slate-50 text-xs text-slate-500">
                            No option image (optional)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-slate-600">
                Tip: Option images should be simple—product, place, style, or
                vibe.
              </div>
            </div>

            {/* Location */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold tracking-wide text-slate-700">
                  CITY / METRO
                </label>
                <input
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                  style={{ borderColor: "#d8deea" }}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Example: New Haven"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-xs font-bold tracking-wide text-slate-700">
                  COUNTRY
                </label>
                <input
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:ring-2"
                  style={{ borderColor: "#d8deea" }}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Example: USA"
                  maxLength={40}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 md:flex-row md:items-center">
              <div className="text-xs text-slate-600">
                Quandr3: <span className="font-semibold">Ask.</span>{" "}
                <span className="font-semibold">Share.</span>{" "}
                <span className="font-semibold">Decide.</span>
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-50"
                style={{ background: canSubmit ? BLUE : "#9fb5f8" }}
              >
                {loading ? "Creating..." : "Create Quandr3"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Main image is optional. Option images are optional.
        </div>
      </div>
    </main>
  );
}
