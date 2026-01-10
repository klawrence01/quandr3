"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GradientButton from "@/app/components/ui/GradientButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

const LS_KEY_QUANDR3S = "q3_local_quandr3s_v1";

type MediaType = "none" | "youtube" | "image";

type Quandr3Draft = {
  id: string;
  category: "Money" | "Style" | "Relationships" | "Other";
  title: string;
  context: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  timerMinutes: number;
  createdAtISO: string;
  status: "Open" | "Resolved";
  mediaType: MediaType;
  youtubeUrl?: string;
  imageName?: string;
};

function loadExisting(): Quandr3Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY_QUANDR3S);
    if (!raw) return [];
    return JSON.parse(raw) as Quandr3Draft[];
  } catch {
    return [];
  }
}

function saveDraft(q: Quandr3Draft) {
  if (typeof window === "undefined") return;
  const list = loadExisting();
  const next = [q, ...list];
  localStorage.setItem(LS_KEY_QUANDR3S, JSON.stringify(next));
}

export default function CreateQuandr3Page() {
  const router = useRouter();

  const [category, setCategory] = useState<Quandr3Draft["category"]>("Money");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [choiceC, setChoiceC] = useState("");
  const [timerMinutes, setTimerMinutes] = useState<number>(60);

  // NEW: media state
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageName, setImageName] = useState<string | undefined>(undefined);

  const canPost = useMemo(() => {
    return (
      title.trim().length >= 10 &&
      choiceA.trim().length > 0 &&
      choiceB.trim().length > 0 &&
      choiceC.trim().length > 0
    );
  }, [title, choiceA, choiceB, choiceC]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    const q: Quandr3Draft = {
      id: `local-${Date.now()}`,
      category,
      title: title.trim(),
      context: context.trim(),
      choiceA: choiceA.trim(),
      choiceB: choiceB.trim(),
      choiceC: choiceC.trim(),
      timerMinutes,
      createdAtISO: new Date().toISOString(),
      status: "Open",
      mediaType,
      youtubeUrl:
        mediaType === "youtube" && youtubeUrl.trim().length > 0
          ? youtubeUrl.trim()
          : undefined,
      imageName: mediaType === "image" ? imageName : undefined,
    };

    saveDraft(q);

    // Later this will go to /q/[id]; for now, send to dashboard feed
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        color: NAVY,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 18px" }}>
        {/* Top row */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #1e63f3 0%, #ff6b6b 50%, #00a9a5 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 10px 26px rgba(11,35,67,0.28)",
              }}
            >
              <img
                src="/assets/logo/quandr3-logo.png"
                alt="Quandr3"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  background: "#ffffff",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 950,
                  letterSpacing: 0.2,
                  fontSize: 16,
                }}
              >
                QUANDR3
              </div>
              <div style={{ fontSize: 12, opacity: 0.82 }}>
                Create a new Quandr3.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(11,35,67,0.16)",
              background: "#ffffff",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </header>

        {/* Main card */}
        <section
          style={{
            borderRadius: 26,
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(11,35,67,0.12)",
            padding: 22,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h1
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: 30,
                fontWeight: 950,
              }}
            >
              What do you need help deciding?
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "rgba(11,35,67,0.85)",
                maxWidth: 520,
              }}
            >
              Keep it real, keep it specific. People will choose A, B, or C —
              and explain why they picked it.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 14, marginTop: 10 }}
          >
            {/* Row: category + timer */}
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  flex: "1 1 180px",
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Category
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Quandr3Draft["category"])
                  }
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(30,99,243,0.25)",
                    background: "#ffffff",
                    fontSize: 14,
                    color: NAVY,
                  }}
                >
                  <option value="Money">Money</option>
                  <option value="Style">Style</option>
                  <option value="Relationships">Relationships</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label
                style={{
                  flex: "1 1 180px",
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                How long should voting stay open?
                <select
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(30,99,243,0.25)",
                    background: "#ffffff",
                    fontSize: 14,
                    color: NAVY,
                  }}
                >
                  <option value={10}>10 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </label>
            </div>

            {/* Question */}
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Your question
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., I just got a $5,000 bonus. What’s the smartest move right now?"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: 16,
                  border: "1px solid rgba(30,99,243,0.25)",
                  background: "#ffffff",
                  fontSize: 15,
                  color: NAVY,
                }}
              />
            </label>

            {/* Context */}
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Context (optional, but helpful)
              </span>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Share just enough story so people understand what’s really at stake."
                rows={3}
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: 16,
                  border: "1px solid rgba(30,99,243,0.18)",
                  background: "#ffffff",
                  fontSize: 14,
                  color: NAVY,
                  resize: "vertical",
                }}
              />
            </label>

            {/* Media section */}
            <div
              style={{
                marginTop: 4,
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(11,35,67,0.12)",
                background: "rgba(11,35,67,0.01)",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(11,35,67,0.9)",
                  }}
                >
                  Media (optional)
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {(["none", "youtube", "image"] as MediaType[]).map((mt) => {
                    const isActive = mediaType === mt;
                    const label =
                      mt === "none"
                        ? "Text only"
                        : mt === "youtube"
                        ? "YouTube link"
                        : "Image upload";
                    return (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => setMediaType(mt)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: isActive
                            ? "1px solid rgba(30,99,243,0.55)"
                            : "1px solid rgba(11,35,67,0.14)",
                          background: isActive
                            ? "rgba(30,99,243,0.06)"
                            : "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          color: isActive ? BLUE : "rgba(11,35,67,0.85)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mediaType === "youtube" && (
                <div style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      opacity: 0.85,
                      fontWeight: 600,
                    }}
                  >
                    YouTube URL
                  </span>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      borderRadius: 12,
                      border: "1px solid rgba(30,99,243,0.25)",
                      background: "#ffffff",
                      fontSize: 13,
                      color: NAVY,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    V1 note: We’ll turn this into an embedded 9-second clip once
                    media goes live.
                  </span>
                </div>
              )}

              {mediaType === "image" && (
                <div style={{ display: "grid", gap: 8 }}>
                  <label
                    style={{
                      fontSize: 12,
                      opacity: 0.85,
                      fontWeight: 600,
                    }}
                  >
                    Upload an image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setImageName(file ? file.name : undefined);
                    }}
                    style={{
                      fontSize: 12,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    V1 note: This is a local-only stub. When we wire Supabase,
                    your image will appear on the Quandr3 card.
                    {imageName && (
                      <span style={{ marginLeft: 6, fontWeight: 600 }}>
                        Selected: {imageName}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {mediaType === "none" && (
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.75,
                  }}
                >
                  Right now we’re text-first. Video and images are optional
                  power-ups for later.
                </span>
              )}
            </div>

            {/* Choices */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              <ChoiceField
                label="Choice A"
                prefix="A"
                value={choiceA}
                onChange={setChoiceA}
                placeholder="Pay down debt"
              />
              <ChoiceField
                label="Choice B"
                prefix="B"
                value={choiceB}
                onChange={setChoiceB}
                placeholder="Save or invest it"
              />
              <ChoiceField
                label="Choice C"
                prefix="C"
                value={choiceC}
                onChange={setChoiceC}
                placeholder="Spend it on something meaningful"
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <GradientButton type="submit" disabled={!canPost}>
                Post Quandr3
              </GradientButton>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(11,35,67,0.16)",
                  background: "#ffffff",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                Save for later (coming soon)
              </button>

              <span
                style={{
                  fontSize: 12,
                  color: "rgba(11,35,67,0.8)",
                  marginLeft: "auto",
                }}
              >
                V1: Quandr3s are stored locally on this device only.
              </span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function ChoiceField({
  label,
  prefix,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  prefix: "A" | "B" | "C";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const color =
    prefix === "A" ? BLUE : prefix === "B" ? TEAL : (CORAL as string);

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 999,
            background: color,
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 900,
            display: "grid",
            placeItems: "center",
          }}
        >
          {prefix}
        </span>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 14,
          border: "1px solid rgba(11,35,67,0.12)",
          background: "#ffffff",
          fontSize: 14,
          color: NAVY,
        }}
      />
    </label>
  );
}
