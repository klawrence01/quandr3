// app/onboarding/invite-preferences/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "quandr3_invite_prefs_v1";

type InvitePrefs = {
  // Who should we prioritize when you invite people to weigh in?
  priorities: string[]; // multi-select
  allowAll: boolean; // if true, anyone can weigh in even if invites are sent
  responsesOptionalCopy: boolean; // show "responses are optional..." helper copy
  expiryNudges: boolean; // nudge user before their Quandr3 expires
};

const DEFAULT_PREFS: InvitePrefs = {
  priorities: ["People like me", "People who’ve been through it"],
  allowAll: true,
  responsesOptionalCopy: true,
  expiryNudges: true,
};

const PRIORITY_OPTIONS = [
  {
    title: "People like me",
    desc: "Similar life stage, goals, or background.",
    tag: "Best for relatability",
  },
  {
    title: "People who’ve been through it",
    desc: "Folks with lived experience in your situation.",
    tag: "Best for real-world advice",
  },
  {
    title: "Professionals / experts",
    desc: "High-signal input when stakes are higher.",
    tag: "Best for accuracy",
  },
  {
    title: "Friends & followers",
    desc: "People who know you and your style.",
    tag: "Best for personal context",
  },
  {
    title: "Anyone (open crowd)",
    desc: "Let the full community weigh in.",
    tag: "Best for volume",
  },
] as const;

function Chip({
  title,
  desc,
  tag,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  tag: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        textAlign: "left",
        padding: 16,
        borderRadius: 18,
        border: active ? "1px solid rgba(0,150,255,0.55)" : "1px solid rgba(0,0,0,0.12)",
        background: active ? "rgba(0,150,255,0.10)" : "#fff",
        boxShadow: active ? "0 10px 26px rgba(0,150,255,0.10)" : "0 6px 18px rgba(0,0,0,0.04)",
        cursor: "pointer",
        color: "#0b0b0b",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 980, fontSize: 15 }}>{title}</div>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 950,
            border: "1px solid rgba(0,0,0,0.10)",
            background: active ? "rgba(0,150,255,0.12)" : "rgba(0,0,0,0.04)",
            opacity: 0.9,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#444", lineHeight: 1.4 }}>{desc}</div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        {active ? "Selected ✅" : "Tap to select"}
      </div>
    </button>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "#fafafa",
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 240 }}>
        <div style={{ fontWeight: 980 }}>{title}</div>
        <div style={{ marginTop: 4, fontSize: 13, color: "#555", lineHeight: 1.4 }}>{subtitle}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 999,
          border: checked ? "1px solid rgba(0,150,255,0.55)" : "1px solid rgba(0,0,0,0.12)",
          background: checked ? "rgba(0,150,255,0.12)" : "#fff",
          cursor: "pointer",
          fontWeight: 950,
          color: "#0b0b0b",
          minWidth: 150,
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: checked ? "rgba(0,150,255,0.85)" : "rgba(0,0,0,0.25)",
            display: "inline-block",
          }}
        />
        {checked ? "On" : "Off"}
      </button>
    </div>
  );
}

export default function InvitePreferencesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<InvitePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<InvitePrefs>;
      setPrefs((prev) => ({
        ...prev,
        ...parsed,
        priorities: Array.isArray(parsed.priorities) ? parsed.priorities : prev.priorities,
      }));
    } catch {
      // ignore
    }
  }, []);

  const selectedCount = prefs.priorities.length;

  const hint = useMemo(() => {
    if (selectedCount === 0) return "Pick at least 1 priority. You can always change this later.";
    if (selectedCount === 1) return "Good. Add more if you want stronger signal.";
    return "Nice. This helps Quandr3 route your question to the right people.";
  }, [selectedCount]);

  function togglePriority(title: string) {
    setPrefs((prev) => {
      const has = prev.priorities.includes(title);
      const next = has ? prev.priorities.filter((x) => x !== title) : [...prev.priorities, title];

      // If they selected "Anyone (open crowd)", also turn allowAll on.
      const includesAnyone = next.includes("Anyone (open crowd)");
      return {
        ...prev,
        priorities: next,
        allowAll: includesAnyone ? true : prev.allowAll,
      };
    });
  }

  const canFinish = prefs.priorities.length >= 1;

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    router.push("/dashboard");
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
        {/* Header */}
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/onboarding/categories"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                color: "#0b0b0b",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              ← Back
            </Link>

            <span style={{ fontSize: 12, opacity: 0.6 }}>Onboarding • Step 2 of 2</span>
          </div>

          <h1 style={{ marginTop: 14, fontSize: 38, fontWeight: 980, letterSpacing: -0.4, lineHeight: 1.05 }}>
            Invite preferences
          </h1>

          <p style={{ marginTop: 10, fontSize: 16, color: "#444", lineHeight: 1.5 }}>
            When you post a Quandr3, who do you want to hear from? This helps the app route your question to the
            right people.
          </p>

          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: 14,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
                Selected: {selectedCount}
              </span>
              <span style={{ fontSize: 13, color: "#555" }}>{hint}</span>
            </div>

            <button
              type="button"
              onClick={() => setPrefs(DEFAULT_PREFS)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Priority grid */}
        <section style={{ marginTop: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 980 }}>Who should we prioritize?</h2>
          <p style={{ marginTop: 6, marginBottom: 0, fontSize: 13, color: "#555", lineHeight: 1.45 }}>
            You can select multiple. (V1: used for targeting + future “invite by lens”.)
          </p>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.title}
                title={opt.title}
                desc={opt.desc}
                tag={opt.tag}
                active={prefs.priorities.includes(opt.title)}
                onClick={() => togglePriority(opt.title)}
              />
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section style={{ marginTop: 18, display: "grid", gap: 12, maxWidth: 900 }}>
          <ToggleRow
            title="Allow anyone to weigh in"
            subtitle="Even if you invite specific people, the community can still vote (bigger sample)."
            checked={prefs.allowAll}
            onChange={(v) => setPrefs((p) => ({ ...p, allowAll: v }))}
          />

          <ToggleRow
            title='Show: “Responses are optional, but helpful.”'
            subtitle="Sets the tone for invited people so they don’t feel pressured."
            checked={prefs.responsesOptionalCopy}
            onChange={(v) => setPrefs((p) => ({ ...p, responsesOptionalCopy: v }))}
          />

          <ToggleRow
            title="Expiry nudges"
            subtitle="We’ll remind you before your Quandr3 closes so you don’t miss the resolution window."
            checked={prefs.expiryNudges}
            onChange={(v) => setPrefs((p) => ({ ...p, expiryNudges: v }))}
          />
        </section>

        {/* Footer actions */}
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={finish}
            disabled={!canFinish}
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              border: canFinish ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(0,0,0,0.08)",
              background: canFinish ? "#0b0b0b" : "rgba(0,0,0,0.12)",
              color: "white",
              fontWeight: 950,
              cursor: canFinish ? "pointer" : "not-allowed",
              opacity: canFinish ? 1 : 0.8,
            }}
            aria-label="Finish onboarding"
          >
            Finish → Dashboard
          </button>

          <span style={{ fontSize: 13, color: "#666" }}>
            Saved locally for now: <code style={{ fontSize: 12 }}>quandr3_invite_prefs_v1</code>
          </span>
        </div>

        <p style={{ marginTop: 14, opacity: 0.55, fontSize: 12, maxWidth: 860 }}>
          V1 note: This sets up the invite + lens routing logic. Later we’ll let users invite by profile/lens, and
          we’ll connect this to real notifications.
        </p>
      </div>
    </main>
  );
}
