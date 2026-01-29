// app/u/[username]/page.tsx
"use client";

// @ts-nocheck

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

const NAVY = "#0b2343";

export default function PublicProfilePage() {
  const params = useParams();
  const rawUsername = params?.username;

  const username =
    typeof rawUsername === "string"
      ? rawUsername
      : Array.isArray(rawUsername)
      ? rawUsername[0]
      : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [quandr3s, setQuandr3s] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setNotFound(false);

      try {
        const handle = decodeURIComponent(username);

        // Profile lookup
        const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .eq("username", handle)
          .maybeSingle();

        if (profError) {
          console.error("Error loading profile", profError);
          if (!isMounted) return;
          setNotFound(true);
          setProfile(null);
          setQuandr3s([]);
          return;
        }

        if (!prof) {
          if (!isMounted) return;
          setNotFound(true);
          setProfile(null);
          setQuandr3s([]);
          return;
        }

        if (!isMounted) return;
        setProfile(prof as Profile);

        // Quandr3s by this member
        const { data: qs, error: qsError } = await supabase
          .from("quandr3s")
          .select("id, title, category, status, created_at")
          .eq("author_id", prof.id)
          .order("created_at", { ascending: false });

        if (qsError) {
          console.error("Error loading quandr3s", qsError);
          if (!isMounted) return;
          setQuandr3s([]);
        } else if (qs && isMounted) {
          setQuandr3s(qs as Quandr3Row[]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [username]);

  const total = quandr3s.length;
  const openCount = quandr3s.filter((q) => q.status === "OPEN").length;
  const resolvedCount = quandr3s.filter((q) => q.status === "RESOLVED").length;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading && (
          <p className="text-sm text-slate-500">Loading member profile…</p>
        )}

        {!loading && notFound && (
          <p className="text-sm font-medium text-red-600">
            Could not find this member.
          </p>
        )}

        {!loading && !notFound && profile && (
          <>
            {/* Header card */}
            <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    {profile.display_name?.[0]?.toUpperCase() ??
                      profile.username?.[0]?.toUpperCase() ??
                      "Q"}
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                      {profile.display_name ?? profile.username}
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Wayfinder
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      This is your public Quandr3 page — what the world sees
                      when they tap your name.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {total}
                    </span>
                  </div>
                  <Link
                    href="/create"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Create a Quandr3
                  </Link>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
                <span className="rounded-full bg-slate-50 px-3 py-1 font-medium uppercase tracking-[0.16em] text-slate-600">
                  Open: {openCount}
                </span>
                <span className="rounded-full bg-slate-50 px-3 py-1 font-medium uppercase tracking-[0.16em] text-slate-600">
                  Resolved: {resolvedCount}
                </span>
              </div>
            </section>

            {/* Quandr3 list */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Quandr3s by {profile.display_name ?? profile.username}
              </h2>

              {quandr3s.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No Quandr3s yet. Once you post, they&apos;ll show up here.
                </p>
              ) : (
                <div className="space-y-3">
                  {quandr3s.map((q) => (
                    <Link
                      key={q.id}
                      href={`/q/${q.id}`}
                      className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {q.category}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {q.title}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700">
                            {q.status}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(q.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
