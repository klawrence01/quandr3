// app/admin/reports/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type ReportRow = {
  id: string;
  reason: string | null;
  created_at: string;
  status?: string | null;
  action?: string | null;
  quandr3_id: string;
  reporter_id: string;
  // hydrated fields we'll attach after extra queries
  quandr3?: {
    id: string;
    title: string;
    category: string;
    status: string;
  } | null;
  reporter?: {
    id: string;
    username: string | null;
    display_name: string | null;
  } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);

      // 1) Get raw reports first (no joins)
      const { data: reportRows, error } = await supabase
        .from("quandr3_reports")
        .select(
          "id, reason, status, action, created_at, quandr3_id, reporter_id"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error loading reports", error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const rows = reportRows || [];

      // If no reports yet, we're done
      if (rows.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // 2) Collect unique Quandr3 IDs and Reporter IDs
      const qIds = Array.from(
        new Set(rows.map((r) => r.quandr3_id).filter(Boolean))
      );
      const reporterIds = Array.from(
        new Set(rows.map((r) => r.reporter_id).filter(Boolean))
      );

      // 3) Fetch related Quandr3s
      let qMap: Record<string, any> = {};
      if (qIds.length > 0) {
        const { data: qs, error: qErr } = await supabase
          .from("quandr3s")
          .select("id, title, category, status")
          .in("id", qIds);

        if (!qErr && qs) {
          qMap = qs.reduce((acc, q) => {
            acc[q.id] = q;
            return acc;
          }, {} as Record<string, any>);
        } else if (qErr) {
          console.warn("Error loading Quandr3s for reports", qErr);
        }
      }

      // 4) Fetch reporter profiles
      let pMap: Record<string, any> = {};
      if (reporterIds.length > 0) {
        const { data: ps, error: pErr } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", reporterIds);

        if (!pErr && ps) {
          pMap = ps.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        } else if (pErr) {
          console.warn("Error loading profiles for reports", pErr);
        }
      }

      // 5) Hydrate reports with joined data
      const hydrated: ReportRow[] = rows.map((r: any) => ({
        ...r,
        quandr3: qMap[r.quandr3_id] || null,
        reporter: pMap[r.reporter_id] || null,
      }));

      setReports(hydrated);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial",
        background: "#ffffff",
        color: "#0b2343",
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 24px 48px",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Reported Quandr3s
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#4b5c86",
                maxWidth: 520,
              }}
            >
              Quick moderation view for Quandr3s that have been reported. Click
              through to review the full context, results, and outcome.
            </p>
          </div>

          <Link
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e63f3",
              textDecoration: "none",
            }}
          >
            ← Back to Explore
          </Link>
        </header>

        {loading && (
          <p style={{ fontSize: 14, color: "#555" }}>Loading reports…</p>
        )}

        {message && (
          <p style={{ fontSize: 14, color: "#c0392b" }}>{message}</p>
        )}

        {!loading && !message && reports.length === 0 && (
          <p style={{ fontSize: 14, color: "#555" }}>
            No reports yet. Once users flag content, it will show up here.
          </p>
        )}

        {/* Reports list */}
        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {reports.map((r) => {
            const q = r.quandr3;
            const reporter = r.reporter;
            const reporterLabel =
              reporter?.username ||
              reporter?.display_name ||
              (r.reporter_id ? "User " + r.reporter_id.slice(0, 8) : "Unknown");

            return (
              <div
                key={r.id}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  border: "1px solid #e1e4ff",
                  background: "#f7f8ff",
                  display: "grid",
                  gap: 6,
                }}
              >
                {/* Top row: category + status + created_at */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: "#1e63f3",
                    }}
                  >
                    {q ? `${q.category} · ${q.status}` : "Unknown Quandr3"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7aa8",
                    }}
                  >
                    Reported {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Title / link */}
                {q ? (
                  <Link
                    href={`/debug/vote/${q.id}`}
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0b2343",
                      textDecoration: "none",
                    }}
                  >
                    {q.title}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0b2343",
                    }}
                  >
                    [Deleted Quandr3]
                  </div>
                )}

                {/* Reason */}
                <div style={{ fontSize: 13, color: "#333" }}>
                  <strong>Reporter note: </strong>
                  {r.reason && r.reason.trim().length > 0
                    ? r.reason
                    : "No additional details provided."}
                </div>

                {/* Reporter + ids */}
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#6b7aa8",
                  }}
                >
                  <strong>Reporter:</strong> {reporterLabel}
                  {reporter?.username && (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/u/${reporter.username}`}
                        style={{
                          color: "#1e63f3",
                          textDecoration: "none",
                        }}
                      >
                        View profile
                      </Link>
                    </>
                  )}
                  {q && (
                    <>
                      {" "}
                      ·{" "}
                      <span>Quandr3 ID: {q.id}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
