"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

export default function TopNav() {
  const pathname = usePathname();

  const isRouteActive = (routes: string[]) =>
    routes.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );

  const exploreActive = isRouteActive(["/explore", "/"]);
  const createActive = isRouteActive([
    "/create",
    "/onboarding",
    "/signup",
    "/login",
  ]);
  const dashboardActive = isRouteActive(["/dashboard"]);

  return (
    <header
      style={{
        width: "100%",
        background: SOFT_BG,
        borderBottom: "1px solid rgba(11,35,67,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "14px 18px 10px",
        }}
      >
        {/* Row 1 — logo + main nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Logo + wordmark */}
          <Link
            href="/home"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg,#1e63f3 0%,#ff6b6b 50%,#00a9a5 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 8px 20px rgba(11,35,67,0.25)",
              }}
            >
              <img
                src="/quandr3-logo.png"
                alt="Quandr3"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: "#ffffff",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  fontSize: 18,
                  color: NAVY,
                }}
              >
                QUANDR3
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  color: "rgba(11,35,67,0.8)",
                }}
              >
                A people-powered clarity engine.
              </div>
            </div>
          </Link>

          {/* Main nav links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {/* Explore */}
            <Link
              href="/explore"
              style={{
                textDecoration: "none",
                color: exploreActive
                  ? BLUE
                  : "rgba(11,35,67,0.9)",
              }}
            >
              Explore
            </Link>

            {/* Create */}
            <Link
              href="/create"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                type="button"
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#ffffff",
                  background: createActive
                    ? "linear-gradient(135deg,#1e63f3 0%,#00a9a5 50%,#ff6b6b 100%)"
                    : "linear-gradient(135deg,#1e63f3 0%,#1e63f3 100%)",
                  boxShadow: "0 14px 30px rgba(11,35,67,0.28)",
                }}
              >
                + Create
              </button>
            </Link>

            {/* Dashboard */}
            <Link
              href="/dashboard"
              style={{
                textDecoration: "none",
                color: dashboardActive
                  ? BLUE
                  : "rgba(11,35,67,0.9)",
              }}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        {/* Row 2 — category pills */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {["Money", "Style", "Relationships"].map((cat) => (
            <span
              key={cat}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(11,35,67,0.08)",
                background: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(11,35,67,0.9)",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
