"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/browser";

export default function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getSession();
    setUser(data?.session?.user ?? null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image
            src="/assets/logo/quandr3-logo.png"
            alt="Quandr3"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">Quandr3</span>
            <span className="-mt-0.5 text-xs text-slate-500">
              Ask. Share. Decide.
            </span>
          </div>
        </Link>

        <nav className="hidden min-w-[120px] flex-1 justify-center md:flex">
          <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/explore" className="transition hover:text-slate-900">
              Explore
            </Link>

            {/* NEW: Founder's Notes */}
            <Link href="/blog" className="transition hover:text-slate-900">
              Founder’s Notes
            </Link>

            <Link href="/invite" className="transition hover:text-slate-900">
              Invite Friends
            </Link>
          </div>
        </nav>

        <div className="flex flex-shrink-0 items-center gap-3">
          <Link
            href="/q/create"
            className="whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-teal-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Create a Quandr3
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 sm:flex">
                <span className="font-medium">{user.email}</span>
                <span className="text-[10px] font-semibold uppercase text-blue-600">
                  Wayfinder
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm transition hover:bg-slate-100"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-3 py-1 text-sm transition hover:bg-slate-100"
              ><Link href="/test" className="text-red-600 font-bold">
  TEST NAV
</Link>
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-full border border-slate-300 px-3 py-1 text-sm transition hover:bg-slate-100"
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