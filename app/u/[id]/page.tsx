// /app/u/[id]/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

/* =========================
   Brand
========================= */
const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

/* =========================
   Helpers
========================= */
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

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

/** ✅ UUID guard so /u/%5Bid%5D doesn't break Supabase */
function isUuid(s?: string) {
  const v = safeStr(s);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

/** ✅ Hard timeout so Loading… can never get stuck forever */
const LOAD_TIMEOUT_MS = 8000;
function withTimeout<T>(p: Promise<T>, label = "Request"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(LOAD_TIMEOUT_MS / 1000)}s`
        )
      );
    }, LOAD_TIMEOUT_MS);

    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const TABS = [
  { key: "latest", label: "Latest Quandr3s" },
  { key: "followers", label: "Followers" },
  { key: "following", label: "Following" },
  { key: "people", label: "People Search" }, // ✅ NEW
];

export default function UserProfilePage() {
  const params = useParams();

  const profileId = useMemo(() => {
    const raw = (params as any)?.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return safeStr(v);
  }, [params]);

  const validProfileId = useMemo(() => isUuid(profileId), [profileId]);

  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [counts, setCounts] = useState({
    followers: 0,
    following: 0,
    referrals: 0, // ✅ NEW: running tally
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);

  const [activeTab, setActiveTab] = useState("latest");

  const [latest, setLatest] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ newest request wins
  const reqRef = useRef(0);

  // ✅ isMe only true when route param is a real UUID AND auth user is loaded
  const isMe = !!me?.id && validProfileId && me.id === profileId;

  /* =========================
     People Search (NEW)
  ========================= */
  const [peopleQ, setPeopleQ] = useState("");
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleErr, setPeopleErr] = useState("");
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const peopleReqRef = useRef(0);

  // Load auth user
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMe(data?.user || null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMe(data?.user || null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Load profile + counts + lists
  useEffect(() => {
    if (!profileId) return;

    const reqId = ++reqRef.current;

    // ✅ If route param is not a UUID, do not query Supabase
    if (!validProfileId) {
      setLoading(false);
      setProfile({
        id: profileId,
        display_name: "",
        username: "",
        bio: "",
        city: "",
        state: "",
        avatar_url: "",
      });
      setCounts({ followers: 0, following: 0, referrals: 0 });
      setIsFollowing(false);
      setLatest([]);
      setFollowersList([]);
      setFollowingList([]);
      setErr("Invalid profile link. Please open a real user profile.");
      setActiveTab("latest");
      return;
    }

    let alive = true;
    setLoading(true);
    setErr("");

    const run = async () => {
      // Wrap the whole load so we *never* hang forever
      return withTimeout(
        (async () => {
          // 1) profile
          let prof: any = null;

          const { data: profRow, error: profErr } = await supabase
            .from("profiles")
            .select("id, display_name, username, bio, city, state, avatar_url")
            .eq("id", profileId)
            .maybeSingle();

          if (!profErr && profRow) prof = profRow;

          if (!prof) {
            prof = {
              id: profileId,
              display_name: "",
              username: "",
              bio: "",
              city: "",
              state: "",
              avatar_url: "",
            };
          }

          // 2) follower/following counts
          const [{ count: followersCount }, { count: followingCount }] =
            await Promise.all([
              supabase
                .from("follows")
                .select("id", { count: "exact", head: true })
                .eq("following_id", profileId),
              supabase
                .from("follows")
                .select("id", { count: "exact", head: true })
                .eq("follower_id", profileId),
            ]);

          // 2b) referral count (profiles.referred_by = this profileId)
          // ✅ This is the running tally you asked for (credit system comes later)
          let referralsCount = 0;
          try {
            const { count } = await supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("referred_by", profileId);

            referralsCount = count || 0;
          } catch {
            // if RLS blocks or column missing, fail soft
            referralsCount = 0;
          }

          // 3) isFollowing
          let followState = false;
          if (me?.id && me.id !== profileId) {
            const { data: fRow } = await supabase
              .from("follows")
              .select("id")
              .eq("follower_id", me.id)
              .eq("following_id", profileId)
              .maybeSingle();
            followState = !!fRow?.id;
          }

          // 4) Latest Quandr3s
          let latestRows: any[] = [];
          let latestErr: any = null;

          const tryAuthor = await supabase
            .from("quandr3s")
            .select("id, title, prompt, status, created_at, city, state")
            .eq("author_id", profileId)
            .order("created_at", { ascending: false })
            .limit(30);

          if (!tryAuthor.error) {
            latestRows = tryAuthor.data || [];
          } else {
            const msg = (tryAuthor.error as any)?.message || "";
            if (
              msg.toLowerCase().includes("author_id") &&
              msg.toLowerCase().includes("does not exist")
            ) {
              const tryUser = await supabase
                .from("quandr3s")
                .select("id, title, prompt, status, created_at, city, state")
                .eq("user_id", profileId)
                .order("created_at", { ascending: false })
                .limit(30);

              if (tryUser.error) latestErr = tryUser.error;
              else latestRows = tryUser.data || [];
            } else {
              latestErr = tryAuthor.error;
            }
          }

          if (latestErr) throw latestErr;

          // 5) Followers / Following lists
          const [followersRes, followingRes] = await Promise.all([
            supabase
              .from("follows")
              .select("follower_id, created_at")
              .eq("following_id", profileId)
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("follows")
              .select("following_id, created_at")
              .eq("follower_id", profileId)
              .order("created_at", { ascending: false })
              .limit(50),
          ]);

          const followerIds = (followersRes?.data || [])
            .map((r: any) => r.follower_id)
            .filter(Boolean);
          const followingIds = (followingRes?.data || [])
            .map((r: any) => r.following_id)
            .filter(Boolean);

          let followersHydrated: any[] = followerIds.map((id: string) => ({
            id,
          }));
          let followingHydrated: any[] = followingIds.map((id: string) => ({
            id,
          }));

          if (followerIds.length) {
            const { data: p } = await supabase
              .from("profiles")
              .select("id, display_name, username, city, state, avatar_url")
              .in("id", followerIds);

            if (p?.length) {
              const map = new Map(p.map((x: any) => [x.id, x]));
              followersHydrated = followerIds.map(
                (id: string) => map.get(id) || { id }
              );
            }
          }

          if (followingIds.length) {
            const { data: p } = await supabase
              .from("profiles")
              .select("id, display_name, username, city, state, avatar_url")
              .in("id", followingIds);

            if (p?.length) {
              const map = new Map(p.map((x: any) => [x.id, x]));
              followingHydrated = followingIds.map(
                (id: string) => map.get(id) || { id }
              );
            }
          }

          return {
            prof,
            followersCount: followersCount || 0,
            followingCount: followingCount || 0,
            referralsCount: referralsCount || 0,
            followState,
            latestRows: latestRows || [],
            followersHydrated,
            followingHydrated,
          };
        })(),
        "Profile load"
      );
    };

    run()
      .then((out: any) => {
        if (!alive) return;
        if (reqId !== reqRef.current) return;

        setProfile(out.prof);
        setCounts({
          followers: out.followersCount,
          following: out.followingCount,
          referrals: out.referralsCount,
        });
        setIsFollowing(out.followState);
        setLatest(out.latestRows);
        setFollowersList(out.followersHydrated);
        setFollowingList(out.followingHydrated);
      })
      .catch((e: any) => {
        if (!alive) return;
        if (reqId !== reqRef.current) return;

        const name = e?.name || "";
        const msg = e?.message || "";

        // ignore cancelled
        if (name === "AbortError" || msg.includes("signal is aborted")) return;

        setErr(msg || "Something went wrong loading this profile.");
      })
      .finally(() => {
        if (reqId === reqRef.current) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [profileId, validProfileId, me?.id]);

  // ✅ People Search query (debounced)
  useEffect(() => {
    if (activeTab !== "people") return;

    const q = safeStr(peopleQ);

    setPeopleErr("");
    if (q.length < 2) {
      setPeopleResults([]);
      setPeopleLoading(false);
      return;
    }

    const myReq = ++peopleReqRef.current;
    setPeopleLoading(true);

    const t = setTimeout(() => {
      withTimeout(
        supabase
          .from("profiles")
          .select("id, display_name, username, city, state, avatar_url")
          .or(
            `display_name.ilike.%${q}%,username.ilike.%${q}%`
          )
          .order("created_at", { ascending: false })
          .limit(30),
        "People search"
      )
        .then(({ data, error }: any) => {
          if (myReq !== peopleReqRef.current) return;
          if (error) throw error;

          const rows = (data || []).filter((p: any) => isUuid(p?.id));
          setPeopleResults(rows);
        })
        .catch((e: any) => {
          if (myReq !== peopleReqRef.current) return;
          const msg = e?.message || "Could not search people.";
          // ignore aborted
          if (msg.includes("signal is aborted")) return;
          setPeopleErr(msg);
          setPeopleResults([]);
        })
        .finally(() => {
          if (myReq !== peopleReqRef.current) return;
          setPeopleLoading(false);
        });
    }, 300);

    return () => clearTimeout(t);
  }, [peopleQ, activeTab]);

  async function toggleFollow() {
    if (!validProfileId) {
      setErr("Invalid profile link.");
      return;
    }

    if (!me?.id) {
      setErr("Please sign in to follow people.");
      return;
    }
    if (!profileId || me.id === profileId) return;

    setBusyFollow(true);
    setErr("");

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", me.id)
          .eq("following_id", profileId);
        if (error) throw error;

        setIsFollowing(false);
        setCounts((c: any) => ({
          ...c,
          followers: Math.max(0, (c.followers || 0) - 1),
        }));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: me.id,
          following_id: profileId,
        });
        if (error) throw error;

        setIsFollowing(true);
        setCounts((c: any) => ({ ...c, followers: (c.followers || 0) + 1 }));
      }
    } catch (e: any) {
      setErr(e?.message || "Could not update follow status.");
    } finally {
      setBusyFollow(false);
    }
  }

  const displayName =
    safeStr(profile?.display_name) || safeStr(profile?.username) || "Curioso";

  const bio = safeStr(profile?.bio);
  const loc = [safeStr(profile?.city), safeStr(profile?.state)]
    .filter(Boolean)
    .join(", ");

  const Panel = ({ children }: any) => (
    <div
      style={{
        background: "white",
        border: "2px solid #0c223c",
        borderRadius: 26,
        padding: 22,
      }}
    >
      {children}
    </div>
  );

  const Pill = ({ onClick, active, children }: any) => (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: `2px solid ${active ? TEAL : "#0c223c"}`,
        background: active ? TEAL : "white",
        color: active ? "white" : NAVY,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  const PersonRow = ({ p }: any) => {
    const name =
      safeStr(p?.display_name) ||
      safeStr(p?.username) ||
      `User ${shortId(p?.id)}`;
    const where = [safeStr(p?.city), safeStr(p?.state)]
      .filter(Boolean)
      .join(", ");

    const pid = safeStr(p?.id);
    const canLink = isUuid(pid);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          borderRadius: 18,
          border: "1px solid #e5ecfb",
          background: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              background: SOFT_BG,
              border: "1px solid #e5ecfb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 1000,
              color: NAVY,
            }}
          >
            {(name?.[0] || "U").toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 1000, color: NAVY }}>{name}</div>
            <div style={{ fontWeight: 800, color: "#5f7896", fontSize: 12 }}>
              {where || shortId(pid)}
            </div>
          </div>
        </div>

        {canLink ? (
          <Link
            href={`/u/${pid}`}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "2px solid #0c223c",
              background: "white",
              color: NAVY,
              fontWeight: 1000,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View
          </Link>
        ) : (
          <span
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "2px solid #0c223c",
              background: "white",
              color: "#7a8aa0",
              fontWeight: 1000,
              whiteSpace: "nowrap",
              opacity: 0.6,
            }}
          >
            View
          </span>
        )}
      </div>
    );
  };

  const Quandr3Row = ({ q }: any) => {
    const title = safeStr(q?.title) || safeStr(q?.prompt) || "Untitled Quandr3";
    const status = safeStr(q?.status || "open").toLowerCase();

    const badge =
      status === "resolved"
        ? { bg: "#e9fff6", fg: TEAL, label: "resolved" }
        : status === "awaiting_user"
        ? { bg: "#fff4e8", fg: "#c26100", label: "awaiting user" }
        : { bg: "#e8f3ff", fg: BLUE, label: "open" };

    return (
      <div
        style={{
          padding: "14px 14px",
          borderRadius: 20,
          border: "1px solid #e5ecfb",
          background: "white",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={`/q/${q.id}`}
              style={{ fontWeight: 1000, color: NAVY, textDecoration: "none" }}
            >
              {title}
            </Link>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: badge.bg,
                border: `1px solid ${badge.fg}22`,
                color: badge.fg,
                fontWeight: 1000,
                fontSize: 12,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              color: "#5f7896",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {fmt(q?.created_at)}
            {q?.city || q?.state ? (
              <span>
                {" "}
                • {safeStr(q?.city)}
                {q?.city && q?.state ? ", " : ""}
                {safeStr(q?.state)}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={`/q/${q.id}`}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: "2px solid #0c223c",
            background: "white",
            color: NAVY,
            fontWeight: 1000,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          View
        </Link>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f2f5fb" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 16px 60px" }}>
        {/* Header panel */}
        <Panel>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 40, fontWeight: 1100, color: NAVY, lineHeight: 1.05 }}>
                {displayName}
              </div>

              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800, color: "#2b405b" }}>
                {bio ? bio : "No bio yet."}
              </div>

              {loc ? (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, color: "#5f7896" }}>
                  {loc}
                </div>
              ) : null}

              {!validProfileId ? (
                <div style={{ marginTop: 10, color: "#8b1e1e", fontWeight: 900, fontSize: 13 }}>
                  This profile link isn’t a real user id. Use “View Profile” in the top bar, or go back to Explore.
                </div>
              ) : null}
            </div>

            {/* Follow + counts */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {me?.id && !isMe && validProfileId ? (
                <button
                  onClick={toggleFollow}
                  disabled={busyFollow}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 999,
                    border: `2px solid ${isFollowing ? "#0c223c" : TEAL}`,
                    background: isFollowing ? "white" : TEAL,
                    color: isFollowing ? NAVY : "white",
                    fontWeight: 1100,
                    cursor: busyFollow ? "not-allowed" : "pointer",
                    minWidth: 120,
                  }}
                >
                  {busyFollow ? "Working..." : isFollowing ? "Unfollow" : "Follow"}
                </button>
              ) : null}

              <button
                onClick={() => validProfileId && setActiveTab("followers")}
                disabled={!validProfileId}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "2px solid #0c223c",
                  background: "white",
                  color: NAVY,
                  fontWeight: 1100,
                  cursor: validProfileId ? "pointer" : "not-allowed",
                  opacity: validProfileId ? 1 : 0.6,
                }}
              >
                Followers ({counts.followers})
              </button>

              <button
                onClick={() => validProfileId && setActiveTab("following")}
                disabled={!validProfileId}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "2px solid #0c223c",
                  background: "white",
                  color: NAVY,
                  fontWeight: 1100,
                  cursor: validProfileId ? "pointer" : "not-allowed",
                  opacity: validProfileId ? 1 : 0.6,
                }}
              >
                Following ({counts.following})
              </button>

              {/* ✅ NEW: referrals tally */}
              <button
                onClick={() => validProfileId && setActiveTab("people")}
                disabled={!validProfileId}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "2px solid #0c223c",
                  background: "white",
                  color: NAVY,
                  fontWeight: 1100,
                  cursor: validProfileId ? "pointer" : "not-allowed",
                  opacity: validProfileId ? 1 : 0.6,
                }}
                title="Referral tally (credit system comes later)"
              >
                Referrals ({counts.referrals})
              </button>
            </div>
          </div>

          {err ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 16,
                background: "#fff1f1",
                border: "1px solid #ffd0d0",
                color: "#8b1e1e",
                fontWeight: 900,
              }}
            >
              {err}
            </div>
          ) : null}
        </Panel>

        {/* Content panel */}
        <div style={{ marginTop: 26 }}>
          <Panel>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 26, fontWeight: 1100, color: NAVY }}>
                {TABS.find((t) => t.key === activeTab)?.label || "Latest Quandr3s"}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill onClick={() => setActiveTab("latest")} active={activeTab === "latest"}>
                  Latest
                </Pill>
                <Pill onClick={() => validProfileId && setActiveTab("followers")} active={activeTab === "followers"}>
                  Followers
                </Pill>
                <Pill onClick={() => validProfileId && setActiveTab("following")} active={activeTab === "following"}>
                  Following
                </Pill>
                <Pill onClick={() => validProfileId && setActiveTab("people")} active={activeTab === "people"}>
                  People
                </Pill>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              {loading ? <div style={{ fontWeight: 900, color: "#2b405b" }}>Loading…</div> : null}

              {!loading && activeTab === "latest" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {latest.length ? latest.map((q) => <Quandr3Row key={q.id} q={q} />) : <div style={{ color: "#5f7896", fontWeight: 900 }}>No posts yet.</div>}
                </div>
              ) : null}

              {!loading && activeTab === "followers" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {followersList.length ? followersList.map((p) => <PersonRow key={p.id} p={p} />) : <div style={{ color: "#5f7896", fontWeight: 900 }}>No followers yet.</div>}
                </div>
              ) : null}

              {!loading && activeTab === "following" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {followingList.length ? followingList.map((p) => <PersonRow key={p.id} p={p} />) : <div style={{ color: "#5f7896", fontWeight: 900 }}>Not following anyone yet.</div>}
                </div>
              ) : null}

              {/* ✅ NEW: People Search */}
              {!loading && activeTab === "people" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      border: "1px solid #e5ecfb",
                      background: "white",
                    }}
                  >
                    <div style={{ fontWeight: 1000, color: NAVY, marginBottom: 8 }}>
                      Find people by name or username
                    </div>

                    <input
                      value={peopleQ}
                      onChange={(e) => setPeopleQ(e.target.value)}
                      placeholder="Type at least 2 characters…"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: "2px solid #e5ecfb",
                        outline: "none",
                        fontWeight: 900,
                        color: NAVY,
                        background: SOFT_BG,
                      }}
                    />

                    <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, color: "#5f7896", fontSize: 12 }}>
                        Tip: search “ken”, “klawrence”, etc.
                      </span>
                      {peopleLoading ? (
                        <span style={{ fontWeight: 1000, color: NAVY, fontSize: 12 }}>Searching…</span>
                      ) : null}
                    </div>

                    {peopleErr ? (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 10,
                          borderRadius: 14,
                          background: "#fff1f1",
                          border: "1px solid #ffd0d0",
                          color: "#8b1e1e",
                          fontWeight: 900,
                        }}
                      >
                        {peopleErr}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {safeStr(peopleQ).length < 2 ? (
                      <div style={{ color: "#5f7896", fontWeight: 900 }}>
                        Start typing to search people.
                      </div>
                    ) : peopleResults.length ? (
                      peopleResults.map((p) => <PersonRow key={p.id} p={p} />)
                    ) : peopleLoading ? null : (
                      <div style={{ color: "#5f7896", fontWeight: 900 }}>
                        No matches found.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        {/* Small back link */}
        <div style={{ marginTop: 18 }}>
          <Link href="/explore" style={{ color: NAVY, fontWeight: 1000, textDecoration: "none" }}>
            ← Back to Explore
          </Link>
        </div>
      </div>
    </div>
  );
}