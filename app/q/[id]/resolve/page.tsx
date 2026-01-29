// app/q/[id]/resolve/page.tsx
"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const CORAL = "#ff6b6b";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function isUuidLike(v: any) {
  const s = safeStr(v);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function indexToLetter(i: number) {
  return String.fromCharCode(65 + i);
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export default function ResolveQuandr3Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String((params as any)?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [row, setRow] = useState<any>(null);
  const [optRows, setOptRows] = useState<any[]>([]);

  const [pickedIndex, setPickedIndex] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // RESULTS PREVIEW (poster-only)
  const [voteTotal, setVoteTotal] = useState(0);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);

  // reasons grouped by index 0-3
  const [reasonsByIndex, setReasonsByIndex] = useState<Record<number, any[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
  });

  const isAuthor = Boolean(user?.id && row?.author_id && user.id === row.author_id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  useEffect(() => {
    if (!id || !isUuidLike(id)) {
      setErr("Invalid Quandr3 ID.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErr(null);

      // Must be logged in to resolve
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        router.push(`/login?redirect=/q/${id}/resolve`);
        return;
      }
      if (!mounted) return;
      setUser(u.user);

      // Load quandr3
      const { data: qData, error: qErr } = await supabase
        .from("quandr3s")
        .select("id,author_id,title,category,status,created_at,resolved_at")
        .eq("id", id)
        .maybeSingle();

      if (!mounted) return;

      if (qErr || !qData) {
        setErr("That Quandr3 could not be found.");
        setLoading(false);
        return;
      }
      setRow(qData);

      // Must be author
      if (!(u.user?.id && qData.author_id && u.user.id === qData.author_id)) {
        setErr("Only the poster can resolve this Quandr3.");
        setLoading(false);
        return;
      }

      // Load options
      const { data: oData, error: oErr } = await supabase
        .from("options")
        .select("id,label,text,quandr3_id")
        .eq("quandr3_id", id);

      if (!mounted) return;

      if (oErr) {
        setErr(oErr.message);
        setLoading(false);
        return;
      }

      const optionsList = Array.isArray(oData) ? oData : [];
      optionsList.sort((a, b) => safeStr(a.label).localeCompare(safeStr(b.label)));
      setOptRows(optionsList);

      // Map option_id -> index (0-3)
      const idToIndex = new Map<string, number>();
      optionsList.slice(0, 4).forEach((o, i) => {
        if (o?.id) idToIndex.set(String(o.id), i);
      });

      // If already resolved, prefill from DB
      const { data: resData } = await supabase
        .from("quandr3_resolutions")
        .select("option_id,note,created_at")
        .eq("quandr3_id", id)
        .maybeSingle();

      if (!mounted) return;

      if (resData?.option_id) {
        const idx = optionsList.findIndex((o) => String(o.id) === String(resData.option_id));
        if (idx >= 0) setPickedIndex(idx);
        setNote(safeStr(resData.note));
      }

      // ===== RESULTS PREVIEW LOAD (votes + vote_reasons) =====
      // 1) Votes for distribution
      const { data: voteRows, error: vErr } = await supabase
        .from("votes")
        .select("id, option_id, voter_id, created_at")
        .eq("quandr3_id", id);

      if (!mounted) return;

      if (vErr) {
        console.warn("Votes load error:", vErr);
      } else {
        const votes = Array.isArray(voteRows) ? voteRows : [];
        setVoteTotal(votes.length);

        const newCounts = [0, 0, 0, 0];
        for (const v of votes) {
          const idx = idToIndex.get(String(v.option_id || ""));
          if (typeof idx === "number") newCounts[idx] += 1;
        }
        setCounts(newCounts);
      }

      // 2) Reasons grouped by option_id (your schema)
      const { data: rRows, error: rErr2 } = await supabase
        .from("vote_reasons")
        .select("id, quandr3_id, option_id, voter_id, reason, created_at")
        .eq("quandr3_id", id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (rErr2) {
        console.warn("Reasons load error:", rErr2);
        setReasonsByIndex({ 0: [], 1: [], 2: [], 3: [] });
      } else {
        const rows = Array.isArray(rRows) ? rRows : [];
        const grouped: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [] };

        for (const r of rows) {
          const idx = idToIndex.get(String(r.option_id || ""));
          if (typeof idx === "number") {
            grouped[idx].push(r);
          }
        }

        setReasonsByIndex(grouped);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const title = safeStr(row?.title) || "Untitled Quandr3";

  const choices = useMemo(() => {
    const arr = (optRows || [])
      .slice(0, 4)
      .map((o, i) => safeStr(o.text) || `Option ${indexToLetter(i)}`);
    while (arr.length < 4) arr.push(`Option ${indexToLetter(arr.length)}`);
    return arr;
  }, [optRows]);

  const pct = useMemo(() => {
    if (!voteTotal) return [0, 0, 0, 0];
    return counts.map((n) => clampPct(Math.round((n / voteTotal) * 100)));
  }, [counts, voteTotal]);

  const winningIndex = useMemo(() => {
    let bestIdx = 0;
    let best = -1;
    counts.forEach((c, i) => {
      if (c > best) {
        best = c;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [counts]);

  async function onResolve() {
    setErr(null);

    if (!user?.id) {
      router.push(`/login?redirect=/q/${id}/resolve`);
      return;
    }
    if (!isAuthor) {
      setErr("Only the poster can resolve this Quandr3.");
      return;
    }

    const optionRow = optRows?.[pickedIndex];
    const optionId = optionRow?.id ? String(optionRow.id) : "";

    if (!optionId) {
      setErr("Options are missing for this Quandr3. (No option_id found)");
      return;
    }

    setSaving(true);

    try {
      // 1) Upsert resolution row
      const { error: rErr } = await supabase
        .from("quandr3_resolutions")
        .upsert(
          {
            quandr3_id: id,
            resolver_id: user.id,
            option_id: optionId,
            note: safeStr(note) || null,
          },
          { onConflict: "quandr3_id" }
        );

      if (rErr) {
        setErr(rErr.message);
        setSaving(false);
        return;
      }

      // 2) Update quandr3s status + resolved_at
      const { error: qErr } = await supabase
        .from("quandr3s")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (qErr) {
        console.warn("quandr3 status update error:", qErr);
      }

      setSaving(false);
      router.push(`/q/${id}`);
      router.refresh();
    } catch (e: any) {
      setErr("Something went wrong while resolving.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui" }}>
        <main style={{ padding: 24 }}>
          <div style={{ maxWidth: 980, margin: "0 auto", color: NAVY, fontWeight: 900 }}>
            Loading…
          </div>
        </main>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui" }}>
        <main style={{ padding: 24 }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ color: CORAL, fontWeight: 950 }}>{err}</div>
            <div style={{ marginTop: 12 }}>
              <Link href={`/q/${id}`} style={{ color: NAVY, fontWeight: 900, textDecoration: "underline" }}>
                Back to Quandr3
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#0b0b0b", fontFamily: "system-ui" }}>
      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={`/q/${id}`}
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
              ← Back to Quandr3
            </Link>

            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 800, color: NAVY }}>Logged in</span>
          </div>

          <h1 style={{ marginTop: 16, fontSize: 30, fontWeight: 980, lineHeight: 1.1 }}>
            Resolve (Poster)
          </h1>
          <p style={{ marginTop: 8, color: "#444", maxWidth: 820 }}>
            Pick the final answer and optionally add a short note explaining your decision.
          </p>

          <section
            style={{
              marginTop: 14,
              borderRadius: 20,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fafafa",
            }}
          >
            <div style={{ fontWeight: 980, fontSize: 14, color: NAVY }}>Quandr3</div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 950 }}>{title}</div>
          </section>

          {/* Resolve controls */}
          <section
            style={{
              marginTop: 14,
              borderRadius: 20,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 980, fontSize: 16 }}>Final pick</div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {choices.map((c, i) => {
                const active = pickedIndex === i;
                return (
                  <button
                    key={`${i}-${c}`}
                    type="button"
                    onClick={() => setPickedIndex(i)}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 14,
                      border: active ? `2px solid ${BLUE}` : "1px solid rgba(0,0,0,0.12)",
                      background: active ? "rgba(30,99,243,0.08)" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span style={{ fontWeight: 980 }}>{indexToLetter(i)}</span>
                      <span style={{ fontWeight: 950 }}>{c}</span>
                    </div>
                    {active ? (
                      <div style={{ marginTop: 6, fontSize: 12, color: BLUE, fontWeight: 900 }}>Selected ✅</div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16, fontWeight: 980, fontSize: 14 }}>Resolution note (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short note explaining why you picked this…"
              rows={5}
              style={{
                marginTop: 8,
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.12)",
                padding: 12,
                fontSize: 14,
                outline: "none",
              }}
            />

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={onResolve}
                disabled={saving}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: saving ? "rgba(0,0,0,0.06)" : NAVY,
                  color: saving ? "#333" : "#fff",
                  fontWeight: 980,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Confirm Resolution"}
              </button>

              <span style={{ fontSize: 12, color: "#666" }}>
                This will publish the final pick on the Quandr3 page.
              </span>
            </div>
          </section>

          {/* Results Preview */}
          <section
            style={{
              marginTop: 14,
              borderRadius: 20,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 980, fontSize: 16 }}>Results Preview</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                  Percentages + reasons (winners and losers).
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#666" }}>
                Votes: <span style={{ fontWeight: 950, color: NAVY }}>{voteTotal}</span>
              </div>
            </div>

            {/* Distribution */}
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {choices.map((label, i) => {
                const percent = clampPct(pct[i] ?? 0);
                const n = counts[i] ?? 0;
                const isWinner = i === winningIndex;

                return (
                  <div
                    key={`dist-${i}`}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "#fff",
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 950 }}>
                        {indexToLetter(i)}. {label}{" "}
                        {isWinner ? (
                          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 950, color: BLUE }}>
                            Winner
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontWeight: 980 }}>
                        {percent}% ({n})
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percent}%`,
                          background: isWinner ? BLUE : "rgba(0,0,0,0.14)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reasons (Winner + each losing option separately) */}
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {/* Winner */}
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 980, color: NAVY }}>
                  Winning reasons ({indexToLetter(winningIndex)})
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                  {(reasonsByIndex[winningIndex] || []).length ? (
                    (reasonsByIndex[winningIndex] || []).slice(0, 25).map((r, idx) => (
                      <div
                        key={`wr-${idx}`}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(0,0,0,0.08)",
                          padding: 10,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontSize: 13, color: "#222", lineHeight: 1.4 }}>
                          {safeStr(r.reason) || "—"}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: "#666" }}>
                          {safeStr(r.created_at) ? new Date(r.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: "#666" }}>No reasons captured yet.</div>
                  )}
                </div>
              </div>

              {/* Losers split by option */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[0, 1, 2, 3]
                  .filter((i) => i !== winningIndex)
                  .map((loserIdx) => (
                    <div
                      key={`loser-${loserIdx}`}
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "#fff",
                        padding: 14,
                      }}
                    >
                      <div style={{ fontWeight: 980, color: NAVY }}>
                        Losing reasons ({indexToLetter(loserIdx)})
                      </div>
                      <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                        {(reasonsByIndex[loserIdx] || []).length ? (
                          (reasonsByIndex[loserIdx] || []).slice(0, 12).map((r, idx) => (
                            <div
                              key={`lr-${loserIdx}-${idx}`}
                              style={{
                                borderRadius: 12,
                                border: "1px solid rgba(0,0,0,0.08)",
                                padding: 10,
                                background: "#fafafa",
                              }}
                            >
                              <div style={{ fontSize: 13, color: "#222", lineHeight: 1.4 }}>
                                {safeStr(r.reason) || "—"}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 11, color: "#666" }}>
                                {safeStr(r.created_at) ? new Date(r.created_at).toLocaleString() : ""}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 13, color: "#666" }}>No reasons captured yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              Note: this preview reads from <code>votes</code> and <code>vote_reasons</code> (grouped by{" "}
              <code>option_id</code>).
            </div>
          </section>

          <p style={{ marginTop: 14, opacity: 0.55, fontSize: 12 }}>
            Supabase live: resolution is saved to <code>quandr3_resolutions</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
