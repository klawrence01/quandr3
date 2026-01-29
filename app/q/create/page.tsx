// app/q/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MediaMode = "text" | "youtube" | "image";

const CATEGORY_OPTIONS = [
  "Money",
  "Career",
  "Relationships",
  "Style",
  "Real Estate",
  "Travel",
  "Health & Fitness",
  "Family",
  "Tech & Gadgets",
  "Other",
];

const TIME_LIMIT_OPTIONS = [
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "3 days", value: 72 },
  { label: "7 days", value: 168 },
];

export default function CreateQuandr3Page() {
  const router = useRouter();

  const [category, setCategory] = useState("Money");
  const [timeLimitHours, setTimeLimitHours] = useState<number | "">(24);

  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  // Media
  const [mediaMode, setMediaMode] = useState<MediaMode>("text");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // derive a single media_url for now
    let mediaUrl: string | null = null;
    if (mediaMode === "youtube" && youtubeUrl.trim()) {
      mediaUrl = youtubeUrl.trim();
    } else if (mediaMode === "image" && imageUrl.trim()) {
      mediaUrl = imageUrl.trim();
    }

    try {
      const res = await fetch("/api/quandr3s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          context,
          category,
          city,
          country,
          timeLimitHours: timeLimitHours === "" ? null : Number(timeLimitHours),
          optionA,
          optionB,
          optionC,
          optionD,
          mediaMode,
          mediaUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          data.error ?? `Failed to create Quandr3 (status ${res.status})`;
        console.error("Create Quandr3 API error:", res.status, data);
        setError(message);
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/q/${data.id}`);
    } catch (err: any) {
      console.error("Create Quandr3 unexpected error:", err);
      setError(err?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-8">
      {/* Header block above the card */}
      <section>
        <div className="text-xs font-semibold tracking-wide text-slate-500">
          QUANDR3 · CREATE A NEW QUANDR3
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          What do you need help deciding?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Keep it real, keep it specific. People will choose A, B, C — or D — and
          explain why they picked it. You get fresh perspective, not noise.
        </p>
      </section>

      {/* Main form card */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Category + time limit */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Category<span className="text-rose-500"> *</span>
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              How long should voting stay open?
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={timeLimitHours === "" ? "" : String(timeLimitHours)}
              onChange={(e) => {
                const val = e.target.value;
                setTimeLimitHours(val === "" ? "" : Number(val));
              }}
            >
              {TIME_LIMIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="">No time limit</option>
            </select>
          </div>
        </div>

        {/* Question + context */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Your question<span className="text-rose-500"> *</span>
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., We’re planning an anniversary trip — which city should we choose?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Context (optional, but helpful)
          </label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={4}
            placeholder="Share just enough story so people understand what’s really at stake."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              City / Metro
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Atlanta, GA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Country
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="USA"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        {/* Options A–D */}
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Options (Wayfinders will choose between these)
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Give at least two honest options (A and B). You can add C and D if
            you have more real alternatives.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Option A<span className="text-rose-500"> *</span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="City / choice A"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Option B<span className="text-rose-500"> *</span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="City / choice B"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Option C (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Another real option"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Option D (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Another real option"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Media section */}
        <div className="border-t border-slate-200 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Media (optional)</h2>
          <p className="mt-1 text-xs text-slate-600">
            Right now we&apos;re text-first. You can attach a YouTube link or an
            image URL to give people more context. Uploads come later.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: "text", label: "Text only" },
              { id: "youtube", label: "YouTube link" },
              { id: "image", label: "Image URL" },
            ].map((btn) => {
              const active = mediaMode === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                  onClick={() => setMediaMode(btn.id as MediaMode)}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {mediaMode === "youtube" && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700">
                YouTube URL
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </div>
          )}

          {mediaMode === "image" && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700">
                Image URL
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/your-image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Posting…" : "Create Quandr3"}
          </button>
        </div>
      </form>
    </div>
  );
}
