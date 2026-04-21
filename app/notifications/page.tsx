"use client";
// @ts-nocheck

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  return (v ?? "").toString();
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState("");
  const [awaitingRows, setAwaitingRows] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id || "";

        if (!alive) return;
        setUserId(uid);

        if (!uid) {
          setAwaitingRows([]);
          return;
        }

        const { data: rows, error } = await supabase
          .from("quandr3s")
          .select("id, title, prompt, status, created_at, closes_at, city, state")
          .eq("author_id", uid)
          .eq("status", "awaiting_user")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!alive) return;
        setAwaitingRows(rows || []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Could not load notifications.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div
          className="rounded-[28px] border bg-white p-6 shadow-sm"
          style={{ borderColor: "#dbe4f0" }}
        >
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: NAVY }}
          >
            Notifications
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Stay on top of decisions that need your response.
          </p>

          {!userId && !loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Please <Link href="/login" className="font-semibold underline">log in</Link> to view notifications.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-slate-700">Loading…</div>
          ) : err ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {err}
            </div>
          ) : (
            <div className="mt-6">
              <div className="mb-4 text-sm font-bold text-slate-700">
                Awaiting Your Response ({awaitingRows.length})
              </div>

              {awaitingRows.length ? (
                <div className="grid gap-4">
                  {awaitingRows.map((r: any) => (
                    <Link
                      key={r.id}
                      href={`/q/${r.id}`}
                      className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div
                            className="text-lg font-extrabold"
                            style={{ color: NAVY }}
                          >
                            {safeStr(r?.title) || "Untitled Quandr3"}
                          </div>

                          {r?.prompt ? (
                            <p className="mt-2 text-sm text-slate-600">
                              {safeStr(r.prompt).slice(0, 160)}
                              {safeStr(r.prompt).length > 160 ? "…" : ""}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {r?.city || r?.state ? (
                              <span>
                                {[safeStr(r?.city), safeStr(r?.state)]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            ) : null}

                            {r?.created_at ? (
                              <>
                                <span>•</span>
                                <span>{fmt(r.created_at)}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          Resolve
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Nothing waiting right now.
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/explore"
              className="text-sm font-semibold underline"
              style={{ color: NAVY }}
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}