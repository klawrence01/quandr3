"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((v || "").trim());
}

function fmt(ts?: any) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function AdminPage() {
  const [me, setMe] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [qid, setQid] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");

  // Search state
  const [qSearch, setQSearch] = useState("");
  const [qStatus, setQStatus] = useState<"" | "open" | "awaiting_user" | "resolved">("");
  const [qResults, setQResults] = useState<any[]>([]);
  const [qSearching, setQSearching] = useState(false);

  const [pSearch, setPSearch] = useState("");
  const [pResults, setPResults] = useState<any[]>([]);
  const [pSearching, setPSearching] = useState(false);

  const okId = useMemo(() => isUuid(qid), [qid]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");

      const { data: u } = await supabase.auth.getUser();
      const user = u?.user || null;
      setMe(user);

      if (!user) {
        setRole("");
        setLoading(false);
        return;
      }

      const { data: p, error } = await supabase.from("profiles").select("id,role,display_name").eq("id", user.id).single();
      if (error) {
        setRole("");
      } else {
        setRole((p?.role || "").toString());
      }
      setLoading(false);
    })();
  }, []);

  async function run(name: string, fn: () => Promise<void>) {
    setMsg("");
    setStatus(`${name}…`);
    try {
      await fn();
      setStatus(`${name} ✅`);
    } catch (e: any) {
      setStatus(`${name} ❌`);
      setMsg(e?.message || "Operation failed.");
    }
  }

  function guardAdmin() {
    if (!me) throw new Error("You must be signed in.");
    if (role !== "admin") throw new Error("Not authorized (admin only).");
  }

  function guardId() {
    guardAdmin();
    if (!okId) throw new Error("Enter a valid Quandr3 UUID.");
  }

  async function deleteChoices() {
    guardId();
    const { error } = await supabase.from("quandr3_choices").delete().eq("quandr3_id", qid.trim());
    if (error) throw error;
  }

  async function deleteOptions() {
    guardId();
    const { error } = await supabase.from("quandr3_options").delete().eq("quandr3_id", qid.trim());
    if (error) throw error;
  }

  async function clearResolutionSetOpen() {
    guardId();
    const { error } = await supabase
      .from("quandr3s")
      .update({
        status: "open",
        resolved_choice_label: null,
        resolved_at: null,
        resolution_note: null,
      })
      .eq("id", qid.trim());
    if (error) throw error;
  }

  async function deleteEntireQuandr3() {
    guardId();

    const { error: e1 } = await supabase.from("quandr3_choices").delete().eq("quandr3_id", qid.trim());
    if (e1) throw e1;

    const { error: e2 } = await supabase.from("quandr3_options").delete().eq("quandr3_id", qid.trim());
    if (e2) throw e2;

    const { error: e3 } = await supabase.from("quandr3s").delete().eq("id", qid.trim());
    if (e3) throw e3;
  }

  async function searchQuandr3s() {
    guardAdmin();
    const term = qSearch.trim();
    if (!term) {
      setQResults([]);
      return;
    }

    setQSearching(true);
    setMsg("");

    try {
      // Note: ilike requires Postgres; this is standard in Supabase
      let query = supabase
        .from("quandr3s")
        .select("id,title,prompt,context,status,author_id,created_at,resolved_at,resolved_choice_label")
        .or(`title.ilike.%${term}%,prompt.ilike.%${term}%,context.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (qStatus) query = query.eq("status", qStatus);

      const { data, error } = await query;
      if (error) throw error;

      setQResults(data || []);
    } finally {
      setQSearching(false);
    }
  }

  async function searchPeople() {
    guardAdmin();
    const term = pSearch.trim();
    if (!term) {
      setPResults([]);
      return;
    }

    setPSearching(true);
    setMsg("");

    try {
      // We search display_name only to avoid creepiness.
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,created_at")
        .ilike("display_name", `%${term}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setPResults(data || []);
    } finally {
      setPSearching(false);
    }
  }

  const adminOk = !loading && me && role === "admin";

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>
            Admin
          </h1>
          <Link href="/explore" className="text-sm font-bold hover:underline" style={{ color: BLUE }}>
            ← Back to Explore
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-5">
          {loading ? (
            <div>Loading…</div>
          ) : !me ? (
            <div className="text-sm text-slate-700">
              You’re not signed in. Sign in first, then return to <b>/admin</b>.
            </div>
          ) : role !== "admin" ? (
            <div className="text-sm text-red-600 font-semibold">
              Not authorized. Your role is <b>{role || "unknown"}</b>. (Needs <b>admin</b>)
            </div>
          ) : (
            <div className="text-sm text-slate-700">
              Signed in as <b>{me?.email || me?.id}</b> • role: <b>admin</b>
            </div>
          )}
        </div>

        {/* SEARCH PANELS */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Search Quandr3s
            </div>

            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Search title/prompt/context…"
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
              disabled={!adminOk}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={qStatus}
                onChange={(e) => setQStatus(e.target.value as any)}
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={!adminOk}
              >
                <option value="">All statuses</option>
                <option value="open">open</option>
                <option value="awaiting_user">awaiting_user</option>
                <option value="resolved">resolved</option>
              </select>

              <button
                onClick={searchQuandr3s}
                disabled={!adminOk}
                className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
                style={{ background: BLUE }}
              >
                {qSearching ? "Searching…" : "Search"}
              </button>

              <button
                onClick={() => {
                  setQSearch("");
                  setQResults([]);
                }}
                disabled={!adminOk}
                className="rounded-xl border px-4 py-2 text-sm font-extrabold disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {(qResults || []).map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                        {r.title || "(Untitled)"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        status: <b>{r.status}</b> • created: {fmt(r.created_at)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 break-all">id: {r.id}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <a
                        href={`/q/${r.id}`}
                        className="rounded-lg border px-3 py-1 text-xs font-extrabold hover:bg-slate-50 text-center"
                        style={{ color: NAVY }}
                      >
                        Open
                      </a>
                      <a
                        href={`/q/${r.id}/resolve`}
                        className="rounded-lg border px-3 py-1 text-xs font-extrabold hover:bg-slate-50 text-center"
                        style={{ color: NAVY }}
                      >
                        Resolve
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {!qSearching && qSearch.trim() && (qResults || []).length === 0 ? (
                <div className="text-xs text-slate-500">No results.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold" style={{ color: NAVY }}>
              Search People
            </div>

            <input
              value={pSearch}
              onChange={(e) => setPSearch(e.target.value)}
              placeholder="Search display name…"
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
              disabled={!adminOk}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={searchPeople}
                disabled={!adminOk}
                className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
                style={{ background: BLUE }}
              >
                {pSearching ? "Searching…" : "Search"}
              </button>

              <button
                onClick={() => {
                  setPSearch("");
                  setPResults([]);
                }}
                disabled={!adminOk}
                className="rounded-xl border px-4 py-2 text-sm font-extrabold disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {(pResults || []).map((p) => (
                <div key={p.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold" style={{ color: NAVY }}>
                        {p.display_name || "(No display name)"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">created: {fmt(p.created_at)}</div>
                      <div className="mt-1 text-xs text-slate-500 break-all">id: {p.id}</div>
                    </div>

                    <a
                      href={`/u/${p.id}`}
                      className="rounded-lg border px-3 py-1 text-xs font-extrabold hover:bg-slate-50 text-center"
                      style={{ color: NAVY }}
                    >
                      Profile
                    </a>
                  </div>
                </div>
              ))}
              {!pSearching && pSearch.trim() && (pResults || []).length === 0 ? (
                <div className="text-xs text-slate-500">No results.</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* DESTRUCTIVE TOOLS */}
        <div className="mt-6 rounded-2xl border bg-white p-5">
          <div className="text-sm font-extrabold" style={{ color: NAVY }}>
            Reset / Delete Tools
          </div>

          <label className="mt-3 block text-xs font-extrabold text-slate-500">Quandr3 ID (UUID)</label>
          <input
            value={qid}
            onChange={(e) => setQid(e.target.value)}
            placeholder="e.g. be99d6a2-5438-4b8a-b747-f72942fbf554"
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            disabled={!adminOk}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              disabled={!adminOk || !okId}
              onClick={() => run("Delete choices", deleteChoices)}
              className="rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
              style={{ background: BLUE }}
            >
              Delete all choices (votes/reasons)
            </button>

            <button
              disabled={!adminOk || !okId}
              onClick={() => run("Delete options", deleteOptions)}
              className="rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
              style={{ background: BLUE }}
            >
              Delete all options
            </button>

            <button
              disabled={!adminOk || !okId}
              onClick={() => run("Reset resolution", clearResolutionSetOpen)}
              className="rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
              style={{ background: BLUE }}
            >
              Reset to Open (clear resolution)
            </button>

            <button
              disabled={!adminOk || !okId}
              onClick={() => {
                if (!confirm("Delete the entire Quandr3 (choices + options + the post)?")) return;
                run("Delete Quandr3", deleteEntireQuandr3);
              }}
              className="rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
              style={{ background: "#ef4444" }}
            >
              Delete entire Quandr3
            </button>
          </div>

          <div className="mt-4 text-sm font-bold" style={{ color: NAVY }}>
            {status}
          </div>
          {msg ? <div className="mt-1 text-sm text-red-600">{msg}</div> : null}
        </div>
      </div>
    </main>
  );
}
