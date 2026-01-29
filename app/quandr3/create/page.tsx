// app/quandr3/create/page.tsx
// @ts-nocheck
"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7ff";

const CATEGORIES = [
  "Money",
  "Style",
  "Relationships",
  "Life",
  "Work & Career",
  "Health",
  "Family",
  "Just Curious",
];

const RESOLUTION_OPTIONS = ["3 hours", "12 hours", "24 hours", "3 days", "7 days"];

type MediaType = "photo" | "video" | null;

export default function CreateQuandr3Page() {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [resolutionWindow, setResolutionWindow] = useState("24 hours");
  const [visibility] = useState<"public" | "followers">("public");

  const [intentReal, setIntentReal] = useState(false);
  const [intentNoHarass, setIntentNoHarass] = useState(false);
  const [intentNoEdit, setIntentNoEdit] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const hasAtLeastTwoOptions =
    optionA.trim().length > 0 && optionB.trim().length > 0;

  const allIntentChecked = intentReal && intentNoHarass && intentNoEdit;

  const canSubmit =
    category.trim().length > 0 &&
    title.trim().length > 0 &&
    hasAtLeastTwoOptions &&
    allIntentChecked &&
    !submitting;

  const optionsPreview = [
    optionA && `A. ${optionA}`,
    optionB && `B. ${optionB}`,
    optionC && `C. ${optionC}`,
    optionD && `D. ${optionD}`,
  ].filter(Boolean) as string[];

  const resolutionLabel = resolutionWindow || "—";

  function getClosesAtFromWindow(windowLabel: string): string {
    const now = new Date();
    let msToAdd = 24 * 60 * 60 * 1000; // default 24 hours

    if (windowLabel === "3 hours") {
      msToAdd = 3 * 60 * 60 * 1000;
    } else if (windowLabel === "12 hours") {
      msToAdd = 12 * 60 * 60 * 1000;
    } else if (windowLabel === "24 hours") {
      msToAdd = 24 * 60 * 60 * 1000;
    } else if (windowLabel === "3 days") {
      msToAdd = 3 * 24 * 60 * 60 * 1000;
    } else if (windowLabel === "7 days") {
      msToAdd = 7 * 24 * 60 * 60 * 1000;
    }

    const closesAt = new Date(now.getTime() + msToAdd);
    return closesAt.toISOString();
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // 1) Ensure user is logged in
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmitError("Please sign in to post a Quandr3.");
        setSubmitting(false);
        return;
      }

      // 2) Build options array
      const optionsArray = [optionA, optionB, optionC, optionD].filter(
        (opt) => opt && opt.trim().length > 0
      );

      // 3) Build payload aligned to your actual table columns
      const payload = {
        user_id: user.id,
        category,
        title,
        context: context || null,
        options: optionsArray,
        resolution_window: resolutionWindow,
        closes_at: getClosesAtFromWindow(resolutionWindow),
        status: "open",
        media_type: mediaType,
        // city & state will be wired later when those fields exist in the UI
        city: null,
        state: null,
        // we are NOT sending intent flags yet (no columns for them)
        // we are NOT sending media_url yet (column is currently "media url", no upload yet)
      };

      // 4) Insert into Supabase
      const { error } = await supabase.from("quandr3s").insert(payload);

      if (error) {
        console.error("Error inserting Quandr3:", error);
        setSubmitError(error.message || "Something went wrong.");
      } else {
        setSubmitSuccess("Your Quandr3 has been posted.");

        // Optional: clear the form
        setTitle("");
        setContext("");
        setOptionA("");
        setOptionB("");
        setOptionC("");
        setOptionD("");
        setMediaType(null);
        setIntentReal(false);
        setIntentNoHarass(false);
        setIntentNoEdit(false);
      }
    } catch (err: any) {
      console.error("Unexpected error inserting Quandr3:", err);
      setSubmitError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: SOFT_BG,
        color: NAVY,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                Create a Quandr3
              </h1>
              <p className="mt-2 max-w-xl text-sm md:text-base">
                Ask a real question. Get real perspective. Decide with
                confidence.
              </p>
            </div>
            <div
              className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: CORAL, color: "#ffffff" }}
            >
              Because intent matters.
            </div>
          </div>
        </header>

        {/* Success / error messages */}
        {(submitError || submitSuccess) && (
          <div className="mb-4 space-y-2 text-sm">
            {submitError && (
              <div
                className="rounded-xl border px-3 py-2"
                style={{ borderColor: CORAL, color: CORAL, background: "#fff" }}
              >
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div
                className="rounded-xl border px-3 py-2"
                style={{ borderColor: TEAL, color: TEAL, background: "#fff" }}
              >
                {submitSuccess}
              </div>
            )}
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
          {/* Left: Form */}
          <section
            className="rounded-2xl border p-5 md:p-6"
            style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: "#e5e7eb",
                  }}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-xs" style={{ color: TEAL }}>
                  Pick the lane where this question really lives. It helps the
                  right people find you.
                </p>
              </div>

              {/* Title & Context */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide">
                    What’s the real dilemma?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="I got two job offers. Which one should I take?"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#e5e7eb" }}
                  />
                  <p className="text-xs">
                    Make this the headline you’d say to a friend. Clear, honest,
                    specific.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide">
                    Give us the backstory{" "}
                    <span className="font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Offer A is closer to home but pays less. Offer B is fully remote but the company is unstable. I’m 42, married, two kids, trying to think long-term…"
                    rows={4}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#e5e7eb" }}
                  />
                  <p className="text-xs" style={{ color: TEAL }}>
                    Context turns random votes into useful insight. Share enough
                    for people to really help you.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide">
                    Your options
                  </h2>
                  <span className="text-[11px]">
                    At least <span className="font-semibold">2</span> options
                    required.
                  </span>
                </div>

                <div className="space-y-2">
                  <OptionInput
                    label="Option A"
                    required
                    value={optionA}
                    onChange={setOptionA}
                    placeholder="Get some overtime and save"
                  />
                  <OptionInput
                    label="Option B"
                    required
                    value={optionB}
                    onChange={setOptionB}
                    placeholder="Invest more"
                  />
                  <OptionInput
                    label="Option C (optional)"
                    value={optionC}
                    onChange={setOptionC}
                    placeholder="Get a HELOC"
                  />
                  <OptionInput
                    label="Option D (optional)"
                    value={optionD}
                    onChange={setOptionD}
                    placeholder="Something else…"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs">
                    Options should be{" "}
                    <span className="font-semibold">real choices</span> you’re
                    seriously considering.
                  </p>
                  <p className="text-[11px]" style={{ color: CORAL }}>
                    Don’t troll. Don’t bait. This is for real decisions, not
                    throwaway polls.
                  </p>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide">
                  Add media{" "}
                  <span className="font-normal lowercase">(optional)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMediaType((prev) =>
                        prev === "photo" ? null : "photo"
                      )
                    }
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderColor:
                        mediaType === "photo" ? BLUE : "rgba(15,23,42,0.1)",
                      backgroundColor:
                        mediaType === "photo" ? BLUE : "#ffffff",
                      color: mediaType === "photo" ? "#ffffff" : NAVY,
                    }}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaType((prev) =>
                        prev === "video" ? null : "video"
                      )
                    }
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderColor:
                        mediaType === "video" ? TEAL : "rgba(15,23,42,0.1)",
                      backgroundColor:
                        mediaType === "video" ? TEAL : "#ffffff",
                      color: mediaType === "video" ? "#ffffff" : NAVY,
                    }}
                  >
                    9-second video
                  </button>
                </div>

                {mediaType && (
                  <div
                    className="rounded-xl border px-4 py-3 text-xs"
                    style={{ borderColor: "#e5e7eb", backgroundColor: SOFT_BG }}
                  >
                    {mediaType === "photo" ? (
                      <>
                        <p className="font-semibold">Upload a photo</p>
                        <p className="mt-1">
                          Show us what you’re talking about — an outfit, a room,
                          a car, a text message (with names blurred), etc.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">
                          Upload or record a 9-second clip
                        </p>
                        <p className="mt-1">
                          Set up the dilemma in 9 seconds. No filters, no
                          editing — just you being real.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution & timing */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide">
                  When do you need to decide?
                </h2>

                <select
                  value={resolutionWindow}
                  onChange={(e) => setResolutionWindow(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <p className="text-xs">
                  We’ll show a countdown so people know how urgent this is.
                </p>
              </div>

              {/* Visibility (for future) */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide">
                  Visibility
                </h2>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      readOnly
                      className="mt-0.5 h-4 w-4 rounded-full border"
                      style={{ accentColor: BLUE, borderColor: "#d1d5db" }}
                    />
                    <span>
                      <span className="font-semibold">Public</span> — Anyone on
                      Quandr3 can see and respond.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 opacity-40">
                    <input
                      type="radio"
                      name="visibility"
                      value="followers"
                      disabled
                      className="mt-0.5 h-4 w-4 rounded-full border"
                      style={{ borderColor: "#d1d5db" }}
                    />
                    <span>
                      <span className="font-semibold">Followers only</span>{" "}
                      (coming soon)
                    </span>
                  </label>
                </div>
              </div>

              {/* Intent & ethics */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide">
                  Intent check-in
                </h2>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={intentReal}
                      onChange={(e) => setIntentReal(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border"
                      style={{ accentColor: BLUE, borderColor: "#d1d5db" }}
                    />
                    <span>
                      This is a real decision I’m facing, not a fake or made-up
                      scenario.
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={intentNoHarass}
                      onChange={(e) => setIntentNoHarass(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border"
                      style={{ accentColor: BLUE, borderColor: "#d1d5db" }}
                    />
                    <span>
                      I’m not using this Quandr3 to target, harass, or embarrass
                      anyone.
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={intentNoEdit}
                      onChange={(e) => setIntentNoEdit(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border"
                      style={{ accentColor: BLUE, borderColor: "#d1d5db" }}
                    />
                    <span>
                      I understand I can’t edit my options after posting. I can
                      only close and resolve.
                    </span>
                  </label>
                </div>

                <p className="text-[11px]" style={{ color: CORAL }}>
                  Quandr3 is people-powered clarity. We protect that by
                  protecting intent.
                </p>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-full px-6 py-2 text-sm font-semibold shadow-sm transition-opacity"
                  style={{
                    backgroundColor: canSubmit ? BLUE : "rgba(30,99,243,0.5)",
                    color: "#ffffff",
                    opacity: canSubmit ? 1 : 0.6,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  {submitting ? "Posting…" : "Post this Quandr3"}
                </button>

                <button
                  type="button"
                  disabled
                  className="text-xs underline underline-offset-2"
                  style={{ color: NAVY, opacity: 0.4, cursor: "not-allowed" }}
                >
                  Save as draft (coming soon)
                </button>

                <p className="w-full text-[11px] md:w-auto">
                  You’ll still be able to write your resolution later — but you{" "}
                  <span className="font-semibold">won’t</span> be able to change
                  these options.
                </p>
              </div>
            </form>
          </section>

          {/* Right: Preview */}
          <aside className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide">
              Live preview
            </h2>

            <div
              className="rounded-2xl border p-4 text-sm shadow-sm md:p-5"
              style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
            >
              {/* Card header */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: NAVY,
                    color: "#ffffff",
                  }}
                >
                  {category || "Category"}
                </span>
                <span className="text-[11px]" style={{ color: BLUE }}>
                  {resolutionLabel} left
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold leading-snug">
                {title || "Your Quandr3 title will show up here."}
              </h3>

              {/* Context preview */}
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed">
                {context
                  ? context
                  : "Add a bit of backstory so people understand what’s really going on. Context turns random votes into real perspective."}
              </p>

              {/* Media preview */}
              {mediaType && (
                <div
                  className="mt-3 flex items-center justify-center overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: SOFT_BG,
                    border: "1px dashed rgba(15,23,42,0.15)",
                    minHeight: "140px",
                  }}
                >
                  {mediaType === "photo" ? (
                    <div className="text-center text-xs">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide">
                        Photo attached
                      </div>
                      <div>Image preview will display here.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-xs">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                        <span
                          style={{
                            borderLeft: `10px solid ${NAVY}`,
                            borderTop: "6px solid transparent",
                            borderBottom: "6px solid transparent",
                            marginLeft: "4px",
                          }}
                        />
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide">
                        9-second video
                      </div>
                      <div>Video thumbnail will display here.</div>
                    </div>
                  )}
                </div>
              )}

              {/* Options preview */}
              <div className="mt-4 space-y-2">
                {optionsPreview.length ? (
                  optionsPreview.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled
                      className="w-full rounded-full px-3 py-2 text-left text-xs font-medium"
                      style={{
                        backgroundColor: SOFT_BG,
                        color: NAVY,
                        cursor: "default",
                      }}
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  <p className="text-xs italic">
                    Your options will appear here. Add at least two real choices
                    to get started.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 border-t pt-3 text-[11px] text-gray-700">
                <div className="mb-1 font-semibold" style={{ color: NAVY }}>
                  0 votes yet · Reasoning will show here once people start
                  weighing in.
                </div>
                <div style={{ color: NAVY, opacity: 0.7 }}>
                  Quandr3 • Real people. Real decisions. Real outcomes.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

type OptionInputProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function OptionInput({
  label,
  required,
  value,
  onChange,
  placeholder,
}: OptionInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        {required && (
          <span className="text-[10px] font-semibold" style={{ color: CORAL }}>
            Required
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2"
        style={{ borderColor: "#e5e7eb" }}
      />
    </div>
  );
}
