"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES_V1 } from "@/app/lib/categories";

const STORAGE_KEY = "quandr3_onboarding_categories_v1";

function Pill({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(0,150,255,0.55)"
          : "1px solid rgba(0,0,0,0.12)",
        background: active ? "rgba(0,150,255,0.10)" : "#fff",
        cursor: "pointer",
        fontWeight: 950,
        color: "#0b0b0b",
        boxShadow: active
          ? "0 8px 22px rgba(0,150,255,0.10)"
          : "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
        {active ? "Selected" : ""}
      </span>
    </button>
  );
}

export default function OnboardingCategoriesPage() {
  const router = useRouter();

  // store selected category IDs (strings)
  const [selected, setSelected] = useState<string[]>([]);

  // Load saved selection (if user returns)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as string[];

      // keep only IDs that exist in our category list
      const valid = parsed.filter((id) =>
        CATEGORIES_V1.some((cat) => cat.id === id)
      );

      setSelected(valid);
    } catch {
      // ignore
    }
  }, []);

  const minRequired = 3;
  const canContinue = selected.length >= minRequired;

  const subtitle = useMemo(() => {
    if (selected.length === 0)
      return `Pick at least ${minRequired} to personalize your feed.`;
    if (!canContinue)
      return `Pick ${minRequired - selected.length} more to continue.`;
    return `Great. You can always change this later.`;
  }, [selected.length, canContinue]);

  function toggle(catId: string) {
    setSelected((prev) =>
      prev.includes(catId)
        ? prev.filter((x) => x !== catId)
        : [...prev, catId]
    );
  }

  function continueNext() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // ignore
    }
    router.push("/onboarding/invite-preferences");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#0b0b0b",
        fontFamily: "system-ui",
        padding: "64px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ maxWidth: 760 }}>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 980,
              letterSpacing: -0.4,
              lineHeight: 1.05,
            }}
          >
            Pick your lanes
          </h1>
          <p
            style={{
              marginTop: 10,
              fontSize: 16,
              color: "#444",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.10)",
                  fontSize: 12,
                  fontWeight: 950,
                }}
              >
                Selected: {selected.length}
              </span>

              <span style={{ fontSize: 13, color: "#555" }}>
                Minimum: {minRequired}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelected([])}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <section style={{ marginTop: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {CATEGORIES_V1.map((cat) => (
              <Pill
                key={cat.id}
                label={cat.label}
                emoji={cat.emoji}
                active={selected.includes(cat.id)}
                onClick={() => toggle(cat.id)}
              />
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={continueNext}
            disabled={!canContinue}
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              border: canContinue
                ? "1px solid rgba(0,0,0,0.10)"
                : "1px solid rgba(0,0,0,0.08)",
              background: canContinue ? "#0b0b0b" : "rgba(0,0,0,0.12)",
              color: "white",
              fontWeight: 950,
              cursor: canContinue ? "pointer" : "not-allowed",
              opacity: canContinue ? 1 : 0.8,
            }}
            aria-label="Continue"
          >
            Continue →
          </button>

          <span style={{ fontSize: 13, color: "#666" }}>
            We’ll use your lanes to prioritize Explore + invites.
          </span>
        </div>
      </div>
    </main>
  );
}
