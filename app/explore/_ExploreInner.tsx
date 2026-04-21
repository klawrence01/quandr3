"use client";
// @ts-nocheck

import { useRouter } from "next/navigation";

import FollowButton from "@/components/social/FollowButton";
import ShareButton from "@/components/social/ShareButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

function safeStr(x: any) {
  return (x ?? "").toString();
}

function hoursLeft(closesAt?: string) {
  if (!closesAt) return null;
  const end = new Date(closesAt).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

function effectiveStatus(row: any) {
  const raw = safeStr(row?.status).toLowerCase();

  if (raw === "awaiting_user") return "awaiting_user";
  if (raw === "resolved") return "resolved";
  if (raw === "open") return "open";

  return "other";
}

function isAuthorRow(row: any, meId?: string) {
  const mine = safeStr(meId).trim().toLowerCase();
  const authorId = safeStr(row?.author_id || row?.user_id)
    .trim()
    .toLowerCase();
  return !!mine && !!authorId && mine === authorId;
}

/* 🔥 STATUS BADGES */
function statusBadgeForRow(row: any, meId?: string) {
  const s = effectiveStatus(row);
  const mine = isAuthorRow(row, meId);

  if (s === "open") {
    return { bg: "#e8f3ff", fg: BLUE, label: "Open" };
  }

  if (s === "awaiting_user") {
    return mine
      ? {
          bg: "#fff4e6",
          fg: "#b45309",
          label: "Awaiting YOUR response",
        }
      : {
          bg: "#fff4e6",
          fg: "#b45309",
          label: "Awaiting Curioso",
        };
  }

  if (s === "resolved") {
    return { bg: "#ecfdf5", fg: "#059669", label: "Resolved" };
  }

  return { bg: "#f1f5f9", fg: "#334155", label: "Unknown" };
}

function tiny(s?: string, n = 170) {
  const x = safeStr(s).trim();
  if (!x) return "";
  if (x.length <= n) return x;
  return x.slice(0, n - 1) + "…";
}

export default function ExploreInner(props: any) {
  const router = useRouter();

  const { loading, error, rows, meId } = props;

  const feed = rows || [];

  return (
    <main style={{ minHeight: "100vh", background: SOFT_BG }}>
      <div className="mx-auto max-w-5xl px-4 py-10">

        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <section className="grid gap-5">
            {feed.map((r: any) => {
              const badge = statusBadgeForRow(r, meId);
              const h = hoursLeft(r?.closes_at);
              const mine = isAuthorRow(r, meId);

              // 🔥 PROFILE DATA
              const profile = r.profiles || {};
              const name =
                profile.display_name ||
                profile.username ||
                `User ${r.author_id?.slice(0, 6) || ""}`;

              const initial = name?.[0]?.toUpperCase() || "U";

              return (
                <div
                  key={r.id}
                  className="rounded-[28px] border bg-white p-6 shadow-sm hover:shadow-md cursor-pointer transition"
                  onClick={() => router.push(`/q/${r.id}`)}
                >

                  {/* 🔥 AUTHOR ROW */}
                  <div className="flex items-center justify-between gap-3">

                    {/* LEFT: Avatar + Name */}
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>

                      <div
                        className="text-sm font-semibold cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/u/${r.author_id}`);
                        }}
                      >
                        {name}
                      </div>
                    </div>

                    {/* RIGHT: Follow + Share */}
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FollowButton profileId={r.author_id} />
                      <ShareButton
                        quandr3Id={r.id}
                        title={r.title}
                        isAuthor={meId === r.author_id}
                      />
                    </div>
                  </div>

                  {/* CATEGORY + YOURS */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                      {(r?.category || "QUANDR3").toUpperCase()}
                    </div>

                    {mine && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-extrabold"
                        style={{
                          background: "rgba(11,35,67,0.08)",
                          color: NAVY,
                        }}
                      >
                        YOURS
                      </span>
                    )}
                  </div>

                  {/* TITLE + STATUS */}
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div
                      className="flex-1 text-2xl font-extrabold leading-tight"
                      style={{ color: NAVY }}
                    >
                      {r?.title}
                    </div>

                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-extrabold"
                      style={{ background: badge.bg, color: badge.fg }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* PROMPT */}
                  {r?.prompt && (
                    <p className="mt-3 text-slate-700">
                      {tiny(r.prompt, 170)}
                    </p>
                  )}

                  {/* FOOTER */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {r?.city || r?.state ? (
                      <span>
                        {[safeStr(r?.city), safeStr(r?.state)]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    ) : null}

                    {r?.created_at && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </>
                    )}

                    {effectiveStatus(r) === "open" && h !== null && (
                      <>
                        <span>•</span>
                        <span>{h}h left</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}