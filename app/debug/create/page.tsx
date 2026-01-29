// @ts-nocheck
"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import { useRouter } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

const CATEGORIES = [
  "Money",
  "Relationships",
  "Career",
  "Style",
  "Lifestyle",
  "Real Estate",
];

const DEFAULT_OPTION_D = "None of these / I’ll explain";

export default function CreateQuandr3Page() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Money");
  const [city, setCity] = useState("New Haven, CT");

  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const a = optA.trim();
    const b = optB.trim();
    const c = optC.trim();
    const d = optD.trim();

    if (!title.trim()) {
      setError("Give your Quandr3 a clear title.");
      return;
    }

    // Require at least 3 options
    if (!a || !b || !c) {
      setError("Please fill in at least options A, B, and C.");
      return;
    }

    const finalD = d || DEFAULT_OPTION_D;

    setSubmitting(true);

    const { data, error: dbError } = await supabase
      .from("quandr3s")
      .insert([
        {
          title: title.trim(),
          category,
          status: "Open",
          city: city.trim() || null,
          option_a: a,
          option_b: b,
          option_c: c,
          option_d: finalD,
        },
      ])
      .select("id")
      .single();

    setSubmitting(false);

    if (dbError) {
      console.log("[CreateQuandr3] Supabase insert error:", dbError);
      setError(dbError.message);
      return;
    }

    setSuccessMessage("Quandr3 created successfully.");
    // Optional: clear form
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");

    if (data?.id) {
      // Small delay then send them to the vote/debug page
      setTimeout(() => {
        router.push(`/debug/vote/${data.id}`);
      }, 600);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "64px 24px 40px",
        fontFamily: "system-ui",
        background: SOFT_BG,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              marginBottom: 6,
              color: NAVY,
            }}
          >
            Create a Quandr3
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#555",
              maxWidth: 540,
            }}
          >
            Frame a real dilemma, give at least three options, and we’ll add a
            final “None of these / I’ll explain” choice if you leave D blank.
            Wayfinders will vote once and share why.
          </p>
        </header>

        <section
          style={{
            borderRadius: 20,
            background: "#ffffff",
            padding: 20,
            boxShadow: "0 20px 50px rgba(15,23,42,0.16)",
            border: "1px solid rgba(15,23,42,0.06)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="title"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 6,
                  color: NAVY,
                }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: I got two job offers, which one should I take?"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #d0d7ff",
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* Category + City */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 6,
                    color: NAVY,
                  }}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #d0d7ff",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 6,
                    color: NAVY,
                  }}
                >
                  City (optional)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: New Haven, CT"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #d0d7ff",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Options */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid #e0e4ff",
                padding: 14,
                background: "#f9f9ff",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      margin: 0,
                      color: NAVY,
                    }}
                  >
                    Options
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    Fill in at least A, B, and C. If you leave D blank, we’ll
                    use: “{DEFAULT_OPTION_D}”.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 8,
                }}
              >
                <OptionField
                  label="Option A"
                  value={optA}
                  onChange={setOptA}
                  required
                  placeholder="Ex: Take the higher-paying job in NYC"
                />
                <OptionField
                  label="Option B"
                  value={optB}
                  onChange={setOptB}
                  required
                  placeholder="Ex: Take the remote job with lower pay"
                />
                <OptionField
                  label="Option C"
                  value={optC}
                  onChange={setOptC}
                  required
                  placeholder="Ex: Stay at my current job for now"
                />
                <OptionField
                  label="Option D (optional)"
                  value={optD}
                  onChange={setOptD}
                  placeholder={`Leave blank to use: "${DEFAULT_OPTION_D}"`}
                />
              </div>
            </div>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#c0392b",
                  marginBottom: 10,
                }}
              >
                {error}
              </p>
            )}

            {successMessage && (
              <p
                style={{
                  fontSize: 13,
                  color: "#16a34a",
                  marginBottom: 10,
                }}
              >
                {successMessage}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/debug/explore")}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "#e5e7f5",
                  color: NAVY,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  background: BLUE,
                  color: "#fff",
                  boxShadow: "0 16px 40px rgba(15,23,42,0.45)",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Posting…" : "Post this Quandr3"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function OptionField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 800,
          marginBottom: 4,
          color: "#111827",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid #d0d7ff",
          padding: "8px 10px",
          fontSize: 13,
          outline: "none",
        }}
      />
    </div>
  );
}
