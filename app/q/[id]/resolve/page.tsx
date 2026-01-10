"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Quandr3Card, { Quandr3Mock } from "@/app/components/Quandr3Card";

type Vote = { pickedIndex: number; votedAt: string };
type Resolution = { pickedIndex: number; note?: string; resolvedAt: string };

function voteKey(id: string) {
  return `quandr3_vote_${id}`;
}
function resolutionKey(id: string) {
  return `quandr3_resolution_${id}`;
}

export default function Quandr3DetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const q: Quandr3Mock = useMemo(
    () => ({
      id,
      poster: { name: "Ken L." },
      category: "Money",
      title: "Pay off the card or stack cash?",
      context:
        "I’ve got $1,200 extra this month. High APR on the card, but I also want an emergency cushion.",
      location: "Connecticut • Local",
      time: "2h ago",
      media: "video",
      layout: "grid4",
      choices: ["Pay card", "Build savings", "Split 70/30", "Other plan"],
      votes: 318,
      status: "Open",
    }),
    [id]
  );

  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(voteKey(id));
      const r = localStorage.getItem(resolutionKey(id));
      setMyVote(v ? JSON.parse(v) : null);
      setResolution(r ? JSON.parse(r) : null);
    } catch {
      setMyVote(null);
      setResolution(null);
    }
  }, [id]);

  function vote(i: number) {
    const payload: Vote = { pickedIndex: i, votedAt: new Date().toISOString() };
    localStorage.setItem(voteKey(id), JSON.stringify(payload));
    setMyVote(payload);
  }

  const isResolved = Boolean(resolution);
  const match =
    isResolved && myVote && resolution && myVote.pickedIndex === resolution.pickedIndex;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#0b0b0b",
        fontFamily: "system-ui",
      }}
    >
      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/explore"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                color: "#0b0b0b",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              ← Back to Explore
            </Link>

            <span style={{ opacity: 0.35 }}>|</span>

            <span style={{ fontSize: 13, opacity: 0.75 }}>
              Percentages stay hidden until you vote.
            </span>

            <Link
              href={`/q/${id}/resolve`}
              style={{
                marginLeft: "auto",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                textDecoration: "none",
                fontWeight: 950,
                color: "#0b0b0b",
                background: "#fff",
              }}
            >
              Resolve (Poster) →
            </Link>
          </div>

          <h1 style={{ marginTop: 16, fontSize: 34, fontWeight: 980, lineHeight: 1.1 }}>
            View Quandr3
          </h1>

          <p style={{ marginTop: 8, color: "#444", maxWidth: 820 }}>
            Vote first to unlock the distribution later. When the poster resolves, match bonuses can
            be awarded.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 14,
            }}
          >
            <div>
              <Quandr3Card
                q={{
                  ...q,
                  status: isResolved ? "Resolved" : q.status,
                }}
              />

              <section
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  padding: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: 980, fontSize: 16 }}>Your vote</div>
                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {q.choices.map((c, i) => {
                    const active = myVote?.pickedIndex === i;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => vote(i)}
                        style={{
                          textAlign: "left",
                          padding: 14,
                          borderRadius: 14,
                          border: active
                            ? "2px solid rgba(0,150,255,0.65)"
                            : "1px solid rgba(0,0,0,0.12)",
                          background: active ? "rgba(0,150,255,0.10)" : "#fff",
                          cursor: "pointer",
                        }}
                        aria-label={`Vote choice ${i + 1}: ${c}`}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                          <span style={{ fontWeight: 980 }}>{String.fromCharCode(65 + i)}</span>
                          <span style={{ fontWeight: 950 }}>{c}</span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                          {active ? "Your vote ✅" : "Vote to reveal distribution (later)"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  padding: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 980 }}>Poster picked</h2>

                  {isResolved && match ? (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,150,255,0.35)",
                        background: "rgba(0,150,255,0.10)",
                        fontWeight: 980,
                        fontSize: 13,
                      }}
                    >
                      ✅ Match bonus: +35
                    </div>
                  ) : null}
                </div>

                {!isResolved ? (
                  <p style={{ marginTop: 10, color: "#444", lineHeight: 1.5 }}>
                    Not resolved yet. When the poster resolves this Quandr3, the final pick will
                    appear here.
                  </p>
                ) : (
                  <>
                    <div style={{ marginTop: 10, fontWeight: 980 }}>
                      {String.fromCharCode(65 + resolution!.pickedIndex)} —{" "}
                      {q.choices[resolution!.pickedIndex]}
                    </div>

                    {resolution?.note ? (
                      <p style={{ marginTop: 8, color: "#444", lineHeight: 1.5 }}>
                        {resolution.note}
                      </p>
                    ) : null}

                    {!myVote ? (
                      <p style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
                        Vote to see if you would have matched.
                      </p>
                    ) : !match ? (
                      <p style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
                        You voted {String.fromCharCode(65 + myVote.pickedIndex)} —{" "}
                        {q.choices[myVote.pickedIndex]}.
                      </p>
                    ) : null}
                  </>
                )}
              </section>
            </div>

            <aside style={{ display: "grid", gap: 14 }}>
              <section
                style={{
                  borderRadius: 20,
                  padding: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fafafa",
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 980 }}>Snapshot</h2>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#666" }}>Votes</div>
                    <div style={{ fontSize: 22, fontWeight: 980 }}>
                      {q.votes.toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#666" }}>Category</div>
                    <div style={{ fontSize: 18, fontWeight: 980 }}>{q.category}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#666" }}>Visibility</div>
                    <div style={{ fontSize: 18, fontWeight: 980 }}>{q.location}</div>
                  </div>
                </div>
              </section>

              <section
                style={{
                  borderRadius: 20,
                  padding: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 980 }}>Comments</h2>
                <p style={{ marginTop: 10, color: "#444", lineHeight: 1.5 }}>
                  Placeholder for short reactions + advice (we’ll wire this after the voting loop).
                </p>
              </section>
            </aside>
          </div>

          <p style={{ marginTop: 14, opacity: 0.55, fontSize: 12 }}>
            Local-only demo: your vote + resolution are stored in your browser for now.
          </p>
        </div>
      </main>
    </div>
  );
}
