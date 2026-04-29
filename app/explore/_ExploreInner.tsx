"use client";
// @ts-nocheck

import { useRouter } from "next/navigation";

import FollowButton from "@/components/social/FollowButton";
import ShareButton from "@/components/social/ShareButton";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const SOFT_BG = "#f5f7fc";

const categoryColors: any = {
  family: "#7c3aed",
  career: "#2563eb",
  money: "#16a34a",
  relationships: "#dc2626",
  relationship: "#dc2626",
  lifestyle: "#ca8a04",
  life: "#ca8a04",
  school: "#0891b2",
  health: "#059669",
  faith: "#9333ea",
  style: "#db2777",
  "real estate": "#92400e",
};

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
  const authorId = safeStr(row?.author_id || row?.user_id).trim().toLowerCase();

  return !!mine && !!authorId && mine === authorId;
}

function statusBadgeForRow(row: any, meId?: string) {
  const s = effectiveStatus(row);
  const mine = isAuthorRow(row, meId);

  if (s === "open") return { bg: "#e8f3ff", fg: BLUE, label: "Open" };

  if (s === "awaiting_user") {
    return mine
      ? { bg: "#fff4e6", fg: "#b45309", label: "Awaiting YOUR response" }
      : { bg: "#fff4e6", fg: "#b45309", label: "Internet Decided" };
  }

  if (s === "resolved") return { bg: "#ecfdf5", fg: "#059669", label: "Resolved" };

  return { bg: "#f1f5f9", fg: "#334155", label: "Unknown" };
}

function actionLabel(row: any, meId?: string) {
  const s = effectiveStatus(row);
  const mine = isAuthorRow(row, meId);

  if (s === "open") return "View & Respond →";
  if (s === "awaiting_user") return mine ? "Resolve Now →" : "View Decision →";
  if (s === "resolved") return "View Outcome →";

  return "View →";
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
        ) : feed.length === 0 ? (
          <div className="rounded-[28px] border bg-white p-6 text-slate-600 shadow-sm">
            No Quandr3s found.
          </div>
        ) : (
          <section className="grid gap-5">
            {feed.map((r: any) => {
              const badge = statusBadgeForRow(r, meId);
              const h = hoursLeft(r?.closes_at);
              const mine = isAuthorRow(r, meId);
              const isAnonymous = Boolean(r?.is_anonymous);

              const profile = r.profiles || {};
              const realName =
                profile.display_name ||
                profile.username ||
                `User ${r.author_id?.slice(0, 6) || ""}`;

              const name = isAnonymous ? "Anonymous" : realName;
              const initial = name?.[0]?.toUpperCase() || "U";
              const status = effectiveStatus(r);
              const closingSoon = status === "open" && h !== null && h <= 6;

              const cat = safeStr(r?.category).toLowerCase();
              const catColor = categoryColors[cat] || "#64748b";

              return (
                <div
                  key={r.id}
                  className="rounded-[28px] border bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md cursor-pointer"
                  onClick={() => router.push(`/q/${r.id}`)}
                >
                  {/* AUTHOR ROW */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {!isAnonymous ? (
                        <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
  ?
</div>
                      )}

                      {!isAnonymous ? (
                        <div
                          className="text-sm font-semibold cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/u/${r.author_id}`);
                          }}
                        >
                          {name}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full border bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                          Anonymous
                        </div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isAnonymous && <FollowButton profileId={r.author_id} />}

                      <ShareButton
                        quandr3Id={r.id}
                        title={r.title}
                        isAuthor={meId === r.author_id}
                      />
                    </div>
                  </div>

                  {/* CATEGORY + YOURS */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: catColor }}
                      />
                      <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500">
                        {(r?.category || "QUANDR3").toUpperCase()}
                      </div>
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

                    {closingSoon && (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-extrabold text-red-600">
                        CLOSING SOON
                      </span>
                    )}
                  </div>

                  {/* TITLE + STATUS */}
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div
                      className="flex-1 text-2xl font-extrabold leading-tight underline decoration-current underline-offset-4 transition hover:opacity-80"
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

                  {r?.prompt && (
                    <p className="mt-3 text-slate-700">{tiny(r.prompt, 170)}</p>
                  )}

                  <div className="mt-4">
                    <span
                      className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-extrabold underline underline-offset-4 transition hover:bg-slate-50"
                      style={{ color: BLUE }}
                    >
                      {actionLabel(r, meId)}
                    </span>
                  </div>

                  {status === "open" && (
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Choose an option and add your reason.
                    </p>
                  )}

                  {status === "awaiting_user" && mine && (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      The internet has weighed in. Now it’s your turn to resolve it.
                    </p>
                  )}

                  {status === "awaiting_user" && !mine && (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      Voting is closed. Waiting for the Curioso’s final decision.
                    </p>
                  )}

                  {status === "resolved" && (
                    <p className="mt-3 text-xs font-medium text-emerald-700">
                      See what the Curioso decided and what everyone can learn.
                    </p>
                  )}

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
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </>
                    )}

                    {status === "open" && h !== null && (
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