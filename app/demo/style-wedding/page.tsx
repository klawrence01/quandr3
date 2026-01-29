// app/demo/style-wedding/page.tsx
"use client";

import { useState } from "react";

type ChoiceKey = "A" | "B" | "C" | "D";

const CHOICES: {
  key: ChoiceKey;
  label: string;
  caption: string;
  image: string;
}[] = [
  {
    key: "A",
    label: "Look A — classic navy suit",
    caption: "Safe, sharp, and timeless.",
    image: "/images/demo/style/look-a-suit.jpg",
  },
  {
    key: "B",
    label: "Look B — light linen + loafers",
    caption: "Breezy and effortless for an outdoor venue.",
    image: "/images/demo/style/look-b-linen.jpg",
  },
  {
    key: "C",
    label: "Look C — all black, slim fit",
    caption: "Clean silhouette, lets the couple shine.",
    image: "/images/demo/style/look-c-black.jpg",
  },
  {
    key: "D",
    label: "Look D — bold pattern jacket",
    caption: "Statement piece: big personality, big risk.",
    image: "/images/demo/style/look-d-pattern.jpg",
  },
];

// Mock results AFTER voting
const RESULT_PERCENT: Record<ChoiceKey, number> = {
  A: 37,
  B: 27,
  C: 22,
  D: 15,
};

export default function StyleWeddingQuandr3Page() {
  const [selected, setSelected] = useState<ChoiceKey | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [why, setWhy] = useState("");
  const [showModal, setShowModal] = useState<ChoiceKey | null>(null);

  const totalVotes = 350;

  const handleSubmit = () => {
    if (!selected) return;
    setHasVoted(true);
  };

  const selectedChoice = CHOICES.find((c) => c.key === selected);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "72px 32px 96px",
        background: "#f5f7ff",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                padding: "6px 10px",
                borderRadius: 999,
                background: "#0f172a",
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Style
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.95)",
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              Open Quandr3
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginLeft: 12,
              }}
            >
              Closes in 6 hours
            </span>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            Friend’s evening wedding — which look wins?
          </h1>

          <p
            style={{
              fontSize: 15,
              opacity: 0.8,
              maxWidth: 720,
            }}
          >
            Outdoor venue, string lights, lots of photos. I want to look sharp
            without outshining the couple. Which fit should I go with?
          </p>
        </header>

        {/* Layout: choices + results */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
            gap: 28,
          }}
        >
          {/* 4-up choices grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {CHOICES.map((choice) => {
              const isActive = selected === choice.key;

              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => setSelected(choice.key)}
                  onDoubleClick={() => setShowModal(choice.key)}
                  style={{
                    position: "relative",
                    border: "none",
                    padding: 0,
                    borderRadius: 22,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#111827",
                    boxShadow: isActive
                      ? "0 20px 40px rgba(0,0,0,0.45)"
                      : "0 14px 32px rgba(15,23,42,0.32)",
                    transform: isActive
                      ? "translateY(-3px) scale(1.01)"
                      : "translateY(0) scale(1)",
                    transition:
                      "transform 140ms ease, box-shadow 140ms ease, border 140ms ease",
                    outline: isActive
                      ? "2px solid rgba(79,70,229,0.9)"
                      : "2px solid transparent",
                  }}
                >
                  <div
                    style={{
                      height: 210,
                      backgroundImage: `url(${choice.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.05))",
                    }}
                  />
                  {/* A/B/C/D badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 14,
                      width: 30,
                      height: 30,
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(15,23,42,0.9)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {choice.key}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      left: 18,
                      right: 18,
                      bottom: 16,
                      color: "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {choice.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.9,
                      }}
                    >
                      {choice.caption}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Submit button row */}
            <div
              style={{
                gridColumn: "1 / -1",
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected || hasVoted}
                style={{
                  padding: "10px 28px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: !selected || hasVoted ? "default" : "pointer",
                  background:
                    !selected || hasVoted
                      ? "linear-gradient(135deg, #9ca3af, #6b7280)"
                      : "linear-gradient(135deg, #1e63f3, #4f46e5)",
                  color: "#fff",
                  boxShadow:
                    !selected || hasVoted
                      ? "0 8px 18px rgba(148,163,184,0.45)"
                      : "0 12px 30px rgba(37,99,235,0.45)",
                  opacity: !selected ? 0.8 : 1,
                  transition:
                    "box-shadow 120ms ease, transform 120ms ease, opacity 120ms ease",
                }}
              >
                {hasVoted ? "Vote submitted" : "Submit your vote"}
              </button>
              <span
                style={{
                  fontSize: 13,
                  opacity: 0.7,
                }}
              >
                Tap a look, then submit. Double-click a photo to zoom.
              </span>
            </div>
          </div>

          {/* Right side: results + why box */}
          <aside
            style={{
              borderRadius: 24,
              background: "#0b1530",
              color: "#e5e7eb",
              padding: 20,
              boxShadow: "0 24px 50px rgba(15,23,42,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.4,
                fontWeight: 800,
                color: "#93c5fd",
              }}
            >
              See how others are leaning
            </div>

            {!hasVoted ? (
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.8,
                  marginBottom: 8,
                }}
              >
                We only show results <strong>after you vote</strong>, so everyone
                answers honestly. Cast your vote to reveal how others are
                leaning.
              </div>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.8,
                  marginBottom: 8,
                }}
              >
                Live snapshot from the community. Not financial, medical, or
                legal advice — just how real people see it.
              </div>
            )}

            {/* Results bars */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 4,
              }}
            >
              {CHOICES.map((choice) => {
                const pct = RESULT_PERCENT[choice.key];
                const isUsersChoice = selected === choice.key;

                return (
                  <div key={choice.key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: isUsersChoice ? 700 : 500,
                          color: isUsersChoice ? "#e5f3ff" : "#e5e7eb",
                        }}
                      >
                        {choice.key}. {choice.label.replace(/^Look [A-D] — /, "")}
                      </span>
                      {hasVoted ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#bfdbfe",
                          }}
                        >
                          {pct}%
                        </span>
                      ) : (
                        <span
                          style={{
                            width: 32,
                            height: 10,
                            borderRadius: 999,
                            background: "rgba(148,163,184,0.4)",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        overflow: "hidden",
                        background: "rgba(15,23,42,0.75)",
                      }}
                    >
                      <div
                        style={{
                          width: hasVoted ? `${pct}%` : "0%",
                          height: "100%",
                          borderRadius: 999,
                          background:
                            choice.key === "A"
                              ? "linear-gradient(90deg,#1d4ed8,#4f46e5)"
                              : choice.key === "B"
                              ? "linear-gradient(90deg,#22c55e,#16a34a)"
                              : choice.key === "C"
                              ? "linear-gradient(90deg,#0ea5e9,#6366f1)"
                              : "linear-gradient(90deg,#f97316,#db2777)",
                          transition: "width 260ms ease-out",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                marginTop: 6,
              }}
            >
              This Quandr3 currently has{" "}
              <strong>{totalVotes.toLocaleString()} votes.</strong> Once it
              closes, the Curioso can post what they actually decided — and why.
            </div>

            {/* Your "why" */}
            {hasVoted && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(148,163,184,0.35)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Share your “why”
                </div>
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Your reasoning is the real value. Help them see what you saw
                  in{" "}
                  <strong>
                    {selectedChoice ? selectedChoice.label : "your choice"}
                  </strong>
                  .
                </div>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="Example: I’d go with B — it fits the venue, photographs well, and doesn’t pull focus from the couple."
                  rows={3}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.7)",
                    padding: "10px 12px",
                    fontFamily: "system-ui",
                    fontSize: 13,
                    background: "rgba(15,23,42,0.75)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                    fontSize: 11,
                    opacity: 0.75,
                  }}
                >
                  <span>
                    Optional. We’ll show it anonymously in the reasoning feed.
                  </span>
                  <span>{why.length}/280</span>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      {/* Simple fullscreen modal for photo zoom */}
      {showModal && (
        <div
          onClick={() => setShowModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            cursor: "zoom-out",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.75)",
            }}
          >
            <div
              style={{
                width: "min(800px, 90vw)",
                height: "min(520px, 90vh)",
                backgroundImage: `url(${
                  CHOICES.find((c) => c.key === showModal)?.image
                })`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <button
              type="button"
              onClick={() => setShowModal(null)}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                borderRadius: 999,
                border: "none",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: "rgba(15,23,42,0.85)",
                color: "#f9fafb",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
