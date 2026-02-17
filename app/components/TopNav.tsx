// app/components/TopNav.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/utils/supabase/browser";

type AuthedUser = {
  id: string;
  email?: string | null;
};

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthedUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ Canonical routes (prevents drift)
  const CREATE_HREF = "/q/create";
  const PROFILE_HREF = useMemo(() => (user?.id ? `/u/${user.id}` : "/login"), [user?.id]);

  const isOnCreate =
    pathname === "/create" || pathname === "/q/create" || pathname?.startsWith("/q/create");
  const isOnExplore = pathname === "/explore" || pathname?.startsWith("/explore");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!alive) return;

        const u = data?.user;
        if (!u) setUser(null);
        else setUser({ id: u.id, email: u.email });
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setCheckingAuth(false);
      }
    }

    load();

    // ✅ stays in sync if auth changes while app is open
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email } : null);
      setCheckingAuth(false);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout() {
    try {
      // ✅ real sign-out
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    // optional legacy route if you still have it
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    }

    router.push("/");
    router.refresh();
  }

  const initial = (user?.email?.[0] || "Q").toUpperCase();

  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/logo/quandr3-logo.png"
              alt="Quandr3 logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-2xl"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">Quandr3</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Ask. Share. Decide.
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/explore"
              className={`text-sm font-medium ${
                isOnExplore ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Explore
            </Link>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <Link
            href={CREATE_HREF}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm whitespace-nowrap transition-transform ${
              isOnCreate ? "scale-[1.02]" : "hover:scale-[1.02]"
            }`}
            style={{
              background: `linear-gradient(90deg, ${BLUE} 0%, ${TEAL} 50%, ${CORAL} 100%)`,
            }}
          >
            Create a Quandr3
          </Link>

          {checkingAuth ? null : user ? (
            <div className="flex items-center gap-2">
              {/* ✅ ALWAYS goes to /u/[uuid] */}
              <Link
                href={PROFILE_HREF}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="View your profile"
              >
                View Profile
              </Link>

              {/* capsule */}
              <Link
                href={PROFILE_HREF}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: NAVY }}
                >
                  {initial}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="max-w-[160px] truncate text-xs font-medium text-slate-800">
                    {user.email}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Wayfinder
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
