import Link from "next/link";
import Image from "next/image";

const colors = {
  pageBg: "#f4f7ff", // soft blue page background
  cardBg: "#ffffff",
  border: "#d9e2ff",
  primaryBlue: "#1554d1", // anchor blue
  teal: "#06b6d4", // accent
  coral: "#fb6b5b", // accent
  textMain: "#0b1220",
  textSubtle: "#4b5563",
  textMuted: "#94a3b8",
};

export default function AboutPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        color: colors.textMain,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Brand header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 14,
                overflow: "hidden",
                background: "#ffffff",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
              }}
            >
              <Image
                src="/quandr3-logo.png"
                alt="QUANDR3 logo"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.03 }}>
                QUANDR3
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                A people-powered clarity engine.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              fontSize: 12,
            }}
          >
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                background: "#ffffff",
                color: colors.primaryBlue,
                fontWeight: 600,
              }}
            >
              About
            </span>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${colors.teal}, ${colors.coral})`,
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              Ask • Share • Decide
            </span>
          </div>
        </header>

        {/* Main card */}
        <main
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "32px 24px 40px",
            borderRadius: 20,
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            lineHeight: 1.6,
          }}
        >
          {/* Header */}
          <h1
            style={{
              fontSize: 42,
              fontWeight: 900,
              marginBottom: 8,
              letterSpacing: -0.03,
            }}
          >
            About Quandr3
          </h1>

          <p
            style={{
              fontSize: 20,
              marginBottom: 32,
              color: colors.textSubtle,
            }}
          >
            Ask. Share. Decide.
          </p>

          {/* Core message */}
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 18, marginBottom: 20 }}>
              Life puts all of us in situations we’ve never faced before. A
              decision, a dilemma, a question — and suddenly it feels like we’re
              supposed to figure it out on our own.
            </p>

            <p style={{ fontSize: 18, marginBottom: 20 }}>
              <strong>Quandr3 exists so you don’t have to.</strong>
            </p>

            <p style={{ fontSize: 18, marginBottom: 20 }}>
              Quandr3 is a safe space for moving forward. It’s where you come to
              ask a real question, see how others would choose, and decide what’s
              right for you.
            </p>

            <p style={{ fontSize: 18, marginBottom: 20 }}>
              Your situation may be new to you. It may even feel extreme. But you
              can be sure of one thing — somewhere, there is a person for whom
              your situation is familiar. Someone who has been there before.
            </p>

            <p style={{ fontSize: 18 }}>
              Quandr3 connects you to that perspective — not to tell you what to
              do, but to help you feel supported, less alone, and more confident
              moving forward.
            </p>
          </section>

          {/* How it works */}
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 850,
                marginBottom: 16,
                letterSpacing: -0.02,
              }}
            >
              How Quandr3 Works
            </h2>

            <ul
              style={{
                fontSize: 17,
                paddingLeft: 20,
                color: colors.textSubtle,
              }}
            >
              <li style={{ marginBottom: 10 }}>
                <strong>Ask.</strong> Post a real question with clear options. Add
                images or a short video if it helps.
              </li>
              <li style={{ marginBottom: 10 }}>
                <strong>Share.</strong> Others respond anonymously. Percentages
                stay hidden until you vote.
              </li>
              <li style={{ marginBottom: 10 }}>
                <strong>Decide.</strong> You resolve the Quandr3. People who
                matched your choice earn points.
              </li>
            </ul>
          </section>

          {/* Philosophy */}
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 850,
                marginBottom: 16,
                letterSpacing: -0.02,
              }}
            >
              What Quandr3 Is — and Isn’t
            </h2>

            <p style={{ fontSize: 18, marginBottom: 16 }}>
              Quandr3 isn’t about arguments, hot takes, or winning debates.
            </p>

            <p style={{ fontSize: 18, marginBottom: 16 }}>
              It’s about perspective. Support. Relief. Knowing that you don’t
              have to make decisions in isolation.
            </p>

            <p style={{ fontSize: 18 }}>
              You always keep your agency. You make the final call. Quandr3
              simply helps you see your options more clearly by learning how
              others would choose.
            </p>
          </section>

          {/* CTA */}
          <section
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid rgba(148,163,184,0.35)",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/explore"
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.teal})`,
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 10px 26px rgba(21,84,209,0.4)",
              }}
            >
              Explore Quandr3s
            </Link>

            <Link
              href="/create"
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                color: colors.primaryBlue,
                background: "#ffffff",
              }}
            >
              Create a Quandr3
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
