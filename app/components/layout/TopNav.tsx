// app/components/layout/TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href === "/explore" && pathname === "/");

  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 0.2,
        padding: "6px 10px",
        borderRadius: 999,
        textDecoration: "none",
        color: isActive ? NAVY : "#1f2933",
        background: isActive ? "rgba(0,169,165,0.12)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.94)",
        borderBottom: "1px solid rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background:
                "radial-gradient(circle at 0% 0%, #ff6b6b, #1e63f3 55%, #00a9a5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(15,23,42,0.22)",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              ?
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 0.3,
                color: NAVY,
              }}
            >
              QUANDR3
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#4b5563",
                letterSpacing: 0.3,
              }}
            >
              A people-powered clarity engine.
            </span>
          </div>
        </Link>

        {/* Right-side nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          {/* Main text links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <NavLink href="/explore" label="Explore" />
            <NavLink href="/about" label="About" />
          </div>

          {/* Utility links (smaller) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
            }}
          >
            <Link
              href="/safety"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Safety
            </Link>
            <Link
              href="/support"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Support
            </Link>
          </div>

          {/* Create button */}
          <Link
            href="/create"
            style={{
              marginLeft: 6,
              padding: "9px 20px",
              borderRadius: 999,
              background: BLUE,
              boxShadow: "0 14px 35px rgba(30,99,243,0.55)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            + Create
          </Link>

          {/* Dashboard link */}
          <Link
            href="/dashboard"
            style={{
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              color: isDashboard ? TEAL : "#1f2933",
              padding: "6px 10px",
              borderRadius: 999,
              background: isDashboard
                ? "rgba(0,169,165,0.12)"
                : "transparent",
            }}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
