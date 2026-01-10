export default function AdminPage() {
  const colors = {
    pageBg: "#f3f4fb",
    cardBg: "#ffffff",
    border: "#d6dde8",
    primaryBlue: "#2563eb",
    coral: "#fb6b5b",
    textMain: "#111827",
    textSubtle: "#4b5563",
    textMuted: "#9ca3af",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: colors.textMain,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 24px 48px",
        }}
      >
        {/* Header */}
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
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 850,
                margin: 0,
                letterSpacing: -0.02,
              }}
            >
              QUANDR3 — Admin Control
            </h1>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                fontSize: 14,
                color: colors.textSubtle,
              }}
            >
              Internal operations only. This area is reserved for moderation,
              platform health, abuse review, category management, and system
              safeguards. No public access.
            </p>
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
                color: colors.textSubtle,
              }}
            >
              Staff only
            </span>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid ${colors.coral}`,
                background: "#fff5f4",
                color: colors.coral,
                fontWeight: 600,
              }}
            >
              Live safety surface (stub)
            </span>
          </div>
        </header>

        {/* Main cards */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {/* Moderation Queue */}
          <section
            style={{
              borderRadius: 18,
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: 18,
              boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Moderation queue
            </h2>
            <p
              style={{
                fontSize: 14,
                color: colors.textSubtle,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              Pending reports and flagged Quandr3s. Review content, apply
              actions, and leave internal notes.
            </p>

            <ul
              style={{
                paddingLeft: 18,
                margin: 0,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              <li>0 items in review (stub)</li>
              <li>Policy tags: harassment, self-harm, spam</li>
              <li>Actions: hide, warn, lock, escalate</li>
            </ul>
          </section>

          {/* Category & Feed Health */}
          <section
            style={{
              borderRadius: 18,
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: 18,
              boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Categories & feed balance
            </h2>
            <p
              style={{
                fontSize: 14,
                color: colors.textSubtle,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              Keep the experience healthy across Money, Relationships, Style,
              and other core categories.
            </p>

            <ul
              style={{
                paddingLeft: 18,
                margin: 0,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              <li>Category manager (add / merge / retire)</li>
              <li>Traffic mix & saturation alerts</li>
              <li>High-risk topics routing (stub)</li>
            </ul>
          </section>

          {/* System Safeguards */}
          <section
            style={{
              borderRadius: 18,
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: 18,
              boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Safeguards & system status
            </h2>
            <p
              style={{
                fontSize: 14,
                color: colors.textSubtle,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              Overview of rate limits, lock rules, and core system health.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: "#f9fafb",
                }}
              >
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>
                  Status
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: colors.primaryBlue,
                  }}
                >
                  All systems nominal
                </div>
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: "#f9fafb",
                }}
              >
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>
                  Rate limits
                </div>
                <div style={{ fontWeight: 700 }}>Default (stub)</div>
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: "#f9fafb",
                }}
              >
                <div style={{ color: colors.textMuted, marginBottom: 2 }}>
                  Escalations
                </div>
                <div style={{ fontWeight: 700 }}>0 open cases</div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer note */}
        <footer
          style={{
            marginTop: 24,
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          This page is a{" "}
          <strong>design stub only</strong>. No live user or content data is
          displayed here yet.
        </footer>
      </div>
    </div>
  );
}
