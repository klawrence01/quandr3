// app/components/TopNav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/utils/supabase/browser";

type AuthedUser = {
  id: string;
  email?: string | null;
};

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthedUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error || !data.user) {
          setUser(null);
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email,
          });
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore; still send them home
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const isOnCreate = pathname === "/create";

  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* LEFT: logo + wordmark + Explore */}
        <div className="flex items-center gap-6">
          {/* Logo + wordmark */}
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
              <span className="text-sm font-semibold text-slate-900">
                Quandr3
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Ask. Share. Decide.
              </span>
            </div>
          </Link>

          {/* Explore link */}
          <nav className="flex items-center gap-6">
            <Link
              href="/explore"
              className={`text-sm font-medium ${
                pathname?.startsWith("/explore")
                  ? "text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Explore
            </Link>
          </nav>
        </div>

        {/* RIGHT: Create pill + auth capsule */}
        <div className="flex items-center gap-3">
          {/* Smaller Create button so it doesn't overpower Explore */}
          <Link
            href="/create"
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm whitespace-nowrap transition-transform ${
              isOnCreate ? "scale-[1.02]" : "hover:scale-[1.02]"
            }`}
            style={{
              background:
                "linear-gradient(90deg, #1e63f3 0%, #00a9a5 50%, #ff6b6b 100%)",
            }}
          >
            Create a Quandr3
          </Link>

          {/* Auth state */}
          {checkingAuth ? null : user ? (
            <div className="flex items-center gap-2">
              {/* ✅ View Profile (correct route: /u/[id]) */}
              <Link
                href={`/u/${user.id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="View your public profile"
              >
                View Profile
              </Link>

              {/* Capsule (also clickable to profile) */}
              <Link
                href={`/u/${user.id}`}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {user.email?.[0]?.toUpperCase() ?? "Q"}
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
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
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
