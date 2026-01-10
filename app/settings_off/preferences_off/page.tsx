// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES_V1 } from "@/app/lib/categories";

/**
 * Local storage keys (V1 – browser only)
 */
const CATS_KEY = "quandr3_onboarding_categories_v1";

const INVITE_KEY_PRIMARY = "quandr3_invite_preferences_v1";
const INVITE_KEY_FALLBACKS = [
  "quandr3_onboarding_invite_preferences_v1",
  "quandr3_invite_preferences_default_v1",
];

type InviteGroup =
  | "people_like_me"
  | "been_through_it"
  | "pros_experts"
  | "friends_followers"
  | "anyone_open";

type InvitePrefs = {
  version: "v1";
  groups: InviteGroup[];
  allowOpenCrowd: boolean;
  showOptionalNote: boolean;
};

const DEFAULT_INVITE_PREFS: InvitePrefs = {
  version: "v1",
  groups: ["people_like_me", "been_through_it"],
  allowOpenCrowd: true,
  showOptionalNote: true,
};

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        borderRadius: 22,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "#fff",
        boxShadow: "0 10px 28px rgba(0,0,0,0.04)",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 980 }}>{title}</h2>
          {subtitle ? (
            <p
              style={{
                marginTop: 6,
                marginBottom: 0,
                color: "#555",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {right}
      </div>

      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function Chip({
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

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
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
      <div style={{ maxWidth: 720 }}>
        <div style={{ fontWeight: 980 }}>{label}</div>
        <div
          style={{
            marginTop: 4,
            color: "#555",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          minWidth: 86,
          padding: "10px 14px",
          borderRadius: 999,
          border: value
            ? "1px solid rgba(0,150,255,0.55)"
            : "1px solid rgba(0,0,0,0.12)",
          background: value ? "rgba(0,150,255,0.12)" : "#fff",
          color: "#0b0b0b",
          fontWeight: 980,
          cursor: "pointer",
        }}
      >
        {value ? "On" : "Off"}
      </button>
    </div>
  );
}

function InviteCard({
  title,
  badge,
  body,
  selected,
  onClick,
}: {
  title: string;
  badge: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        textAlign: "left",
        borderRadius: 18,
        border: selected
          ? "1px solid rgba(0,150,255,0.55)"
          : "1px solid rgba(0,0,0,0.10)",
        background: selected ? "rgba(0,150,255,0.10)" : "#fff",
        padding: 16,
        cursor: "pointer",
        boxShadow: selected
          ? "0 10px 28px rgba(0,150,255,0.10)"
          : "0 8px 22px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 980 }}>{title}</div>
        <span
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(0,0,0,0.04)",
            fontSize: 12,
            fontWeight: 950,
            color: "#333",
          }}
        >
          {badge}
        </span>
      </div>

      <div style={{ marginTop: 8, color: "#444", lineHeight: 1.4 }}>
        {body}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: selected ? "#0b0b0b" : "#666",
          fontWeight: 900,
        }}
      >
        {selected ? "Selected ✅" : "Tap to select"}
      </div>
    </button>
  );
}

export default function PreferencesPage() {
  // Selected category IDs
  const [cats, setCats] = useState<string[]>([]);
  const [invite, setInvite] = useState<InvitePrefs>(DEFAULT_INVITE_PREFS);
  const [savedMsg, setSavedMsg] = useState("");

  // Load stored values on mount
  useEffect(() => {
    // Categories
    const catRaw = readJSON<string[]>(CATS_KEY);
    if (catRaw?.length) {
      const valid = catRaw.filter((id) =>
        CATEGORIES_V1.some((cat) => cat.id === id)
      );
      setCats(valid);
    }

    // Invite prefs
    let found = readJSON<InvitePrefs>(INVITE_KEY_PRIMARY);

    if (!found) {
      for (const k of INVITE_KEY_FALLBACKS) {
        const v = readJSON<InvitePrefs>(k);
        if (v) {
          found = v;
          break;
        }
      }
    }

    if (found && found.version === "v1") {
      setInvite({
        version: "v1",
        groups: Array.isArray(found.groups)
          ? found.groups
          : DEFAULT_INVITE_PREFS.groups,
        allowOpenCrowd:
          typeof found.allowOpenCrowd === "boolean"
            ? found.allowOpenCrowd
            : DEFAULT_INVITE_PREFS.allowOpenCrowd,
        showOptionalNote:
          typeof found.showOptionalNote === "boolean"
            ? found.showOptionalNote
            : DEFAULT_INVITE_PREFS.showOptionalNote,
      });
    }
  }, []);

  const canSave = useMemo(() => cats.length >= 3, [cats.length]);

  function toggleCat(catId: string) {
    setCats((prev) =>
      prev.includes(catId)
        ? prev.filter((x) => x !== catId)
        : [...prev, catId]
    );
  }

  function toggleGroup(group: InviteGroup) {
    setInvite((prev) => {
      const on = prev.groups.includes(group);
      const nextGroups = on
        ? prev.groups.filter((g) => g !== group)
        : [...prev.groups, group];
      return { ...prev, groups: nextGroups };
    });
  }

  function saveAll() {
    if (!canSave) {
      setSavedMsg("Pick at least 3 categories before saving.");
      return;
    }

    writeJSON(CATS_KEY, cats);
    writeJSON(INVITE_KEY_PRIMARY, invite);

    setSavedMsg("Saved ✅");
    window.setTimeout(() => setSavedMsg(""), 1800);
  }

  function resetAll() {
    setCats([]);
    setInvite(DEFAULT_INVITE_PREFS);
    setSavedMsg("Reset (not saved) — hit Save to confirm.");
    window.setTimeout(() => setSavedMsg(""), 2200);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#0b0b0b",
        fontFamily: "system-ui",
        padding: "56px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 38,
                fontWeight: 980,
                letterSpacing: -0.4,
                lineHeight: 1.05,
              }}
            >
              Preferences
            </h1>
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#444",
                lineHeight: 1.5,
              }}
            >
              These become your defaults. Create can load these automatically,
              and you can override per post.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/explore"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                color: "#0b0b0b",
                textDecoration: "none",
                fontWeight: 950,
              }}
            >
              ← Back to Explore
            </Link>

            <button
              type="button"
              onClick={resetAll}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={saveAll}
              disabled={!canSave}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: canSave
                  ? "1px solid rgba(0,0,0,0.10)"
                  : "1px solid rgba(0,0,0,0.08)",
                background: canSave ? "#0b0b0b" : "rgba(0,0,0,0.12)",
                color: "#fff",
                fontWeight: 980,
                cursor: canSave ? "pointer" : "not-allowed",
                opacity: canSave ? 1 : 0.8,
              }}
            >
              Save
            </button>
          </div>
        </div>

        {savedMsg ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fafafa",
              fontWeight: 900,
              color: "#0b0b0b",
              maxWidth: 520,
            }}
          >
            {savedMsg}
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {/* Categories */}
          <Section
            title="Categories (your lanes)"
            subtitle="Pick at least 3. This prioritizes your Explore feed and helps future invites."
            right={
              <span
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(0,0,0,0.04)",
                  fontSize: 12,
                  fontWeight: 950,
                  color: cats.length >= 3 ? "#0b0b0b" : "#b00020",
                }}
              >
                Selected: {cats.length} {cats.length >= 3 ? "" : "(min 3)"}
              </span>
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {CATEGORIES_V1.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  emoji={cat.emoji}
                  active={cats.includes(cat.id)}
                  onClick={() => toggleCat(cat.id)}
                />
              ))}
            </div>
          </Section>

          {/* Invite preferences */}
          <Section
            title="Invite preferences (default)"
            subtitle='Used for targeting + future "invite by lens". You can override per post.'
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 12,
              }}
            >
              <InviteCard
                title="People like me"
                badge="Best for relatability"
                body="Similar life stage, goals, or background."
                selected={invite.groups.includes("people_like_me")}
                onClick={() => toggleGroup("people_like_me")}
              />
              <InviteCard
                title="People who’ve been through it"
                badge="Best for real-world advice"
                body="Folks with lived experience in your situation."
                selected={invite.groups.includes("been_through_it")}
                onClick={() => toggleGroup("been_through_it")}
              />
              <InviteCard
                title="Professionals / experts"
                badge="Best for accuracy"
                body="High-signal input when stakes are higher."
                selected={invite.groups.includes("pros_experts")}
                onClick={() => toggleGroup("pros_experts")}
              />
              <InviteCard
                title="Friends & followers"
                badge="Best for personal context"
                body="People who know you and your style."
                selected={invite.groups.includes("friends_followers")}
                onClick={() => toggleGroup("friends_followers")}
              />
              <InviteCard
                title="Anyone (open crowd)"
                badge="Best for volume"
                body="Let the full community weigh in."
                selected={invite.groups.includes("anyone_open")}
                onClick={() => toggleGroup("anyone_open")}
              />
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <Toggle
                label="Allow anyone to weigh in"
                description="Even if you prioritize specific people, the community can still vote (bigger sample)."
                value={invite.allowOpenCrowd}
                onChange={(v) =>
                  setInvite((prev) => ({ ...prev, allowOpenCrowd: v }))
                }
              />

              <Toggle
                label='Show note: “Responses are optional, but helpful.”'
                description="Keeps the tone light. No pressure on invited people."
                value={invite.showOptionalNote}
                onChange={(v) =>
                  setInvite((prev) => ({ ...prev, showOptionalNote: v }))
                }
              />
            </div>
          </Section>

          {/* Wiring hint */}
          <Section
            title="Next wiring (after you save)"
            subtitle="Create can load these defaults automatically."
          >
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                border: "1px dashed rgba(0,0,0,0.18)",
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 980 }}>Coming next</div>
              <div
                style={{
                  marginTop: 6,
                  color: "#444",
                  lineHeight: 1.5,
                }}
              >
                • Create page reads categories + invite preferences from
                localStorage
                <br />
                • Shows “Loaded from preferences · override per post”
                <br />
                • Saves per-post overrides with the draft/post
              </div>
            </div>
          </Section>
        </div>

        <p style={{ marginTop: 14, opacity: 0.55, fontSize: 12 }}>
          Local-only V1: saved in your browser. Later we’ll persist this per
          user in the DB.
        </p>
      </div>
    </main>
  );
}
