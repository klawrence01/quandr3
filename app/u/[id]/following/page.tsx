// /app/u/[id]/following/_FollowingInner.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function shortId(id?: string) {
  const s = safeStr(id);
  if (!s) return "";
  return s.length <= 10 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function displayName(p: any) {
  return (
    safeStr(p?.display_name) ||
    safeStr(p?.full_name) ||
    safeStr(p?.username) ||
    ""
  );
}

function avatarFallbackDataUrl(label: string) {
  const t = (label || "C").slice(0, 1).toUpperCase();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1e63f3"/>
        <stop offset="0.6" stop-color="#00a9a5"/>
        <stop offset="1" stop-color="#ff6b6b"/>
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="24" fill="url(#g)"/>
    <text x="50%" y="56%" text-anchor="middle" font-size="44" font-weight="800" fill="white" font-family="Arial, Helvetica, sans-serif">${t}</text>
  </svg>
  `.trim();
  const encoded = encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export default function FollowingInner() {
  const params = useParams();

  const userId = useMemo(() => {
    const raw: any = (params as any)?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRows([]);

      try {
        // 1) get followed ids (who this user is following)
        const rel = await supabase
          .from("follows")
          .select("followed_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .limit(200);

        if (rel.error) throw rel.error;

        const relRows = rel.data || [];
        const ids = Array.from(
          new Set(relRows.map((r: any) => r?.followed_id).filter(Boolean))
        );

        // 2) get profiles
        let pMap: Record<string, any> = {};
        if (ids.length) {
          const prof = await supabase
            .from("profiles")
            .select("id, username, display_name, full_name, avatar_url, what_i_know")
            .in("id", ids.slice(0, 300));

          if (!prof.error && Array.isArray(prof.data)) {
            for (const p of prof.data) pMap[p.id] = p;
          }
        }

        const merged = relRows.map((r: any) => ({
          ...r,
          profile: pMap[r.followed_id] || { id: r.followed_id },
        }));

        if (!ignore) setRows(merged);
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "Could not load following.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [userId]);

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>
            Following
          </h1>

          {/* ✅ real link back to profile */}
          <Link
            href={`/u/${userId}`}
            className="rounded-full px-5 py-3 text-sm font-extrabold text-white"
            style={{ background: BLUE }}
          >
            Back to Profile
          </Link>
        </div>

        <section className="mt-6 rounded-[28px] border bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : err ? (
            <div className="text-sm text-red-600">{err}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-700">Not following anyone yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rows.map((r: any) => {
                const p = r.profile || {};
                const name = displayName(p) || `Curioso ${shortId(p?.id)}`;
                const avatar =
                  safeStr(p?.avatar_url) || avatarFallbackDataUrl(name);

                return (
                  <Link
                    key={r.followed_id}
                    href={`/u/${r.followed_id}`}
                    className="rounded-2xl border p-4 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border bg-white">
                        <Image
                          src={avatar}
                          alt={name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-extrabold"
                          style={{ color: NAVY }}
                        >
                          {name}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          Curioso ID: {shortId(p?.id || r.followed_id)}
                        </div>
                      </div>

                      <div className="ml-auto text-xs font-semibold text-slate-500">
                        Following
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 text-center text-xs text-slate-500">
          Quandr3: <span className="font-semibold">Ask.</span>{" "}
          <span className="font-semibold">Share.</span>{" "}
          <span className="font-semibold">Decide.</span>
        </div>
      </div>
    </main>
  );
}
