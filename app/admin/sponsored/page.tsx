// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const SOFT = "#f5f7fc";

type SponsoredStatus = "pending" | "approved" | "rejected" | "live" | "expired";

type SponsoredRow = {
  id: string;
  business_name: string;
  city: string;
  category: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  status: SponsoredStatus;
  admin_notes: string | null;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
};

const STATUS_TABS: { key: SponsoredStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "live", label: "Live" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
];

export default function AdminSponsoredPage() {
  const [items, setItems] = useState<SponsoredRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] =
    useState<SponsoredStatus | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      let query = supabase
        .from("sponsored_quandr3s")
        .select(
          `
          id,
          business_name,
          city,
          category,
          question,
          choice_a,
          choice_b,
          choice_c,
          choice_d,
          status,
          admin_notes,
          created_at,
          start_date,
          end_date
        `
        )
        .order("created_at", { ascending: false });

      if (activeStatus !== "all") {
        query = query.eq("status", activeStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setMessage(error.message);
        setItems([]);
      } else {
        setItems((data || []) as SponsoredRow[]);
      }

      setLoading(false);
    }

    load();
  }, [activeStatus]);

  async function handleApprove(row: SponsoredRow) {
    if (!confirm(`Approve and set LIVE for "${row.business_name}"?`)) return;

    try {
      setBusyId(row.id);

      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

      // For now, approval = go live immediately.
      const { data, error } = await supabase
        .from("sponsored_quandr3s")
        .update({
          status: "live",
          approved_at: now.toISOString(),
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          admin_notes: null,
        })
        .eq("id", row.id)
        .select()
        .single();

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === row.id ? (data as any) : item))
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error approving: ${err.message || err}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(row: SponsoredRow) {
    const reason =
      window.prompt(
        `Add an optional note when rejecting "${row.business_name}":`
      ) || null;

    if (!confirm(`Reject sponsored Quandr3 for "${row.business_name}"?`)) {
      return;
    }

    try {
      setBusyId(row.id);

      const now = new Date();

      const { data, error } = await supabase
        .from("sponsored_quandr3s")
        .update({
          status: "rejected",
          rejected_at: now.toISOString(),
          admin_notes: reason,
        })
        .eq("id", row.id)
        .select()
        .single();

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === row.id ? (data as any) : item))
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error rejecting: ${err.message || err}`);
    } finally {
      setBusyId(null);
    }
  }

  const filteredCount = items.length;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "80px 24px 40px",
        fontFamily: "system-ui",
        maxWidth: 1120,
        margin: "0 auto",
        background: SOFT,
        color: NAVY,
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            margin: 0,
            color: BLUE,
          }}
        >
          Admin · Sponsored Verticals
        </p>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 900,
            margin: "6px 0 8px",
          }}
        >
          Business Quandr3 Review Queue
        </h1>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(11,35,67,0.9)",
            maxWidth: 700,
            margin: 0,
          }}
        >
          Approve or reject Sponsored Verticals before they appear at the top of
          the local feed. Approving a request will immediately mark it as{" "}
          <strong>Live</strong> for 7 days in the selected city + category.
        </p>
      </header>

      {/* Status tabs */}
      <section
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {STATUS_TABS.map((tab) => {
          const active = tab.key === activeStatus;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                border: active
                  ? "none"
                  : "1px solid rgba(11,35,67,0.16)",
                background: active ? BLUE : "#ffffff",
                color: active ? "#ffffff" : NAVY,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

      {/* Status message */}
      {message && (
        <p
          style={{
            fontSize: 13,
            color: "#b3261e",
            marginBottom: 12,
          }}
        >
          {message}
        </p>
      )}

      {loading && (
        <p
          style={{
            fontSize: 13,
            color: "rgba(11,35,67,0.9)",
          }}
        >
          Loading sponsored requests…
        </p>
      )}

      {!loading && filteredCount === 0 && (
        <p
          style={{
            fontSize: 13,
            color: "rgba(11,35,67,0.8)",
          }}
        >
          No sponsored requests in this state yet.
        </p>
      )}

      {/* Cards list */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 8,
        }}
      >
        {items.map((row) => (
          <article
            key={row.id}
            style={{
              borderRadius: 18,
              padding: 16,
              background: "#ffffff",
              boxShadow: "0 14px 40px rgba(15,23,42,0.12)",
              border: "1px solid rgba(11,35,67,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Top line: business + city + status pill */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {row.business_name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(11,35,67,0.9)",
                  }}
                >
                  {row.city} ·{" "}
                  <span style={{ fontWeight: 700 }}>{row.category}</span>
                </div>
              </div>

              <StatusPill status={row.status} />
            </div>

            {/* Question */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  fontWeight: 800,
                  color: "rgba(11,35,67,0.8)",
                  marginBottom: 3,
                }}
              >
                Business Quandr3
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: NAVY,
                }}
              >
                {row.question}
              </div>
            </div>

            {/* Choices */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 8,
              }}
            >
              <ChoiceChip label="A" text={row.choice_a} />
              <ChoiceChip label="B" text={row.choice_b} />
              <ChoiceChip label="C" text={row.choice_c} />
              <ChoiceChip label="D" text={row.choice_d} />
            </div>

            {/* Meta line + actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(11,35,67,0.8)",
                }}
              >
                Submitted{" "}
                {new Date(row.created_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {row.start_date && (
                  <>
                    {" · Live from "}
                    {new Date(row.start_date).toLocaleDateString()}{" "}
                    {" to "}
                    {row.end_date
                      ? new Date(row.end_date).toLocaleDateString()
                      : "—"}
                  </>
                )}
                {row.admin_notes && (
                  <>
                    {" · Notes: "}
                    <span style={{ fontStyle: "italic" }}>
                      {row.admin_notes}
                    </span>
                  </>
                )}
              </div>

              {row.status === "pending" && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleReject(row)}
                    disabled={busyId === row.id}
                    style={{
                      borderRadius: 999,
                      border: "1px solid rgba(11,35,67,0.18)",
                      background: "#ffffff",
                      padding: "7px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {busyId === row.id ? "Working…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(row)}
                    disabled={busyId === row.id}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                      padding: "7px 16px",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "0 10px 26px rgba(15,23,42,0.35)",
                    }}
                  >
                    {busyId === row.id ? "Approving…" : "Approve & Go Live"}
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: SponsoredStatus }) {
  let bg = "rgba(11,35,67,0.08)";
  let text = NAVY;

  if (status === "pending") {
    bg = "rgba(255,196,0,0.15)";
    text = "#8a5a00";
  } else if (status === "live") {
    bg = "rgba(30,99,243,0.15)";
    text = BLUE;
  } else if (status === "approved") {
    bg = "rgba(0,169,165,0.15)";
    text = TEAL;
  } else if (status === "rejected") {
    bg = "rgba(220,38,38,0.12)";
    text = "#b3261e";
  } else if (status === "expired") {
    bg = "rgba(148,163,184,0.16)";
    text = "#475569";
  }

  return (
    <span
      style={{
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        background: bg,
        color: text,
      }}
    >
      {status}
    </span>
  );
}

function ChoiceChip({ label, text }: { label: string; text: string }) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "6px 10px",
        background: "rgba(11,35,67,0.03)",
        border: "1px solid rgba(11,35,67,0.06)",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          background: "rgba(11,35,67,0.08)",
          color: NAVY,
        }}
      >
        {label}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}
