"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const CREATE_HREF = "/q/create";
  const PROFILE_HREF = useMemo(
    () => (user?.id ? `/u/${user.id}` : "/login"),
    [user?.id]
  );

  const isOnCreate =
    pathname === "/create" ||
    pathname === "/q/create" ||
    pathname?.startsWith("/q/create");

  const isOnExplore =
    pathname === "/explore" || pathname?.startsWith("/explore");

  const isOnNotifications =
    pathname === "/notifications" || pathname?.startsWith("/notifications");

  const isOnBlog = pathname === "/blog" || pathname?.startsWith("/blog");
  const isOnInvite = pathname === "/invite" || pathname?.startsWith("/invite");
  const isOnProfile = !!user?.id && pathname?.startsWith(`/u/${user.id}`);

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

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email } : null);
        setCheckingAuth(false);
      }
    );

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const uid = user?.id;

    if (!uid) {
      setAwaitingCount(0);
      return;
    }

    let alive = true;

    async function loadAwaiting() {
      const { count } = await supabase
        .from("quandr3s")
        .select("*", { count: "exact", head: true })
        .eq("author_id", uid)
        .eq("status", "awaiting_user");

      if (!alive) return;
      setAwaitingCount(count || 0);
    }

    loadAwaiting();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}

    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (user?.email?.[0] || "Q").toUpperCase();

  const menuLinkClass = (active?: boolean) =>
    `block rounded-xl px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-slate-100 text-slate-900"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:font-semibold"
    }`;

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
              <span className="text-sm font-semibold text-slate-900">
                Quandr3
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Ask. Share. Decide.
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/explore"
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isOnExplore
                  ? "text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
              style={
                isOnExplore
                  ? { background: `linear-gradient(90deg, ${BLUE}, ${TEAL})` }
                  : undefined
              }
            >
              Explore
            </Link>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* 🔔 NOTIFICATION BELL */}
          {user && (
            <Link
              href="/notifications"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-white hover:bg-slate-50 ${
                isOnNotifications ? "border-slate-400" : "border-slate-200"
              }`}
              title="Notifications"
            >
              <span className="text-lg">🔔</span>

              {awaitingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {awaitingCount}
                </span>
              )}
            </Link>
          )}

          {/* CREATE */}
          <Link
            href={CREATE_HREF}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-transform sm:text-sm ${
              isOnCreate ? "scale-[1.02]" : "hover:scale-[1.02]"
            }`}
            style={{
              background: `linear-gradient(90deg, ${BLUE} 0%, ${TEAL} 50%, ${CORAL} 100%)`,
            }}
          >
            Create
          </Link>

          {checkingAuth ? null : user ? (
            <>
              {/* PROFILE */}
              <Link
                href={PROFILE_HREF}
                className={`flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 shadow-sm ${
                  isOnProfile ? "border-slate-400" : "border-slate-200"
                }`}
                title="Profile"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: NAVY }}
                >
                  {initial}
                </div>
              </Link>

              {/* HAMBURGER MENU */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  title="Menu"
                >
                  <span className="text-lg">☰</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {user.email}
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Wayfinder
                      </div>
                    </div>

                    <div className="space-y-1 py-2">
                      <Link
                        href="/blog"
                        className={menuLinkClass(isOnBlog)}
                        onClick={() => setMenuOpen(false)}
                      >
                        Founder’s Notes
                      </Link>

                      <Link
                        href="/invite"
                        className={menuLinkClass(isOnInvite)}
                        onClick={() => setMenuOpen(false)}
                      >
                        Invite
                      </Link>

                      <Link
                        href={PROFILE_HREF}
                        className={menuLinkClass(isOnProfile)}
                        onClick={() => setMenuOpen(false)}
                      >
                        View Profile
                      </Link>

                      <Link
                        href="/notifications"
                        className={menuLinkClass(isOnNotifications)}
                        onClick={() => setMenuOpen(false)}
                      >
                        Notifications
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 hover:font-semibold"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
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