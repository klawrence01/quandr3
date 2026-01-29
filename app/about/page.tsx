// app/about/page.tsx

export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "64px 24px 96px",
        fontFamily: "system-ui",
        color: "#0b2343",
      }}
    >
      {/* Hero */}
      <section style={{ marginBottom: 40 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "#00a9a5",
            marginBottom: 12,
          }}
        >
          About Quandr3
        </p>
        <h1
          style={{
            fontSize: 44,
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: -0.4,
            marginBottom: 16,
          }}
        >
          A people-powered clarity engine.
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 640,
            color: "#1f2933",
          }}
        >
          Quandr3 is where real people help you make better decisions. You bring
          the crossroads moment. The community brings perspective. Together, you
          walk away with options you actually feel good about.
        </p>
      </section>

      {/* Two-column intro */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
          gap: 32,
          marginBottom: 56,
        }}
      >
        <div
          style={{
            background: "#f7f9ff",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Why Quandr3 exists
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
            Most platforms are built to keep you scrolling, not to help you
            decide. Quandr3 flips that script. It’s designed for the exact
            moment when you’re stuck between options—big or small—and need
            honest, targeted input instead of random noise.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7 }}>
            Our job is simple: create a safe, structured space where good people
            can share what they know, so you can see your choices clearly and
            move forward with confidence.
          </p>
        </div>

        <aside
          style={{
            borderRadius: 20,
            padding: 20,
            border: "1px solid rgba(15, 23, 42, 0.06)",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Snapshot
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <li style={{ marginBottom: 8 }}>
              <strong>Format:</strong> short scenarios, four options, real
              votes.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Focus:</strong> everyday crossroads—money, style,
              relationships, and beyond.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Built for:</strong> curious people who want better
              outcomes, not more arguing.
            </li>
            <li>
              <strong>Core idea:</strong> better questions + better input =
              stronger decisions.
            </li>
          </ul>
        </aside>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: 56 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 16,
          }}
        >
          How Quandr3 works
        </h2>
        <p
          style={{
            fontSize: 16,
            maxWidth: 640,
            marginBottom: 24,
            color: "#1f2933",
          }}
        >
          We keep the flow simple on purpose, so you can focus on the decision
          itself—not on learning another complicated app.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              label: "1. Ask",
              title: "Post your Quandr3",
              body: "Share the real situation, what you’re choosing between, and what matters most to you.",
            },
            {
              label: "2. Share",
              title: "Invite Wayfinders",
              body: "People you trust—and people with experience—vote, explain their reasoning, and surface angles you may have missed.",
            },
            {
              label: "3. Decide",
              title: "See the path forward",
              body: "View the results, read the thinking behind each choice, and close your Quandr3 when you’re ready.",
            },
          ].map((step) => (
            <div
              key={step.label}
              style={{
                borderRadius: 18,
                padding: 20,
                background: "#ffffff",
                border: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  color: "#00a9a5",
                  marginBottom: 6,
                }}
              >
                {step.label}
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What makes it different */}
      <section style={{ marginBottom: 56 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 16,
          }}
        >
          What makes Quandr3 different
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: "#f7f9ff",
            }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Context, not hot takes
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              Votes are important, but the “why” matters more. Quandr3
              encourages short, honest explanations so you can see the thinking
              behind each option.
            </p>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: "#ffffff",
              border: "1px solid rgba(15, 23, 42, 0.06)",
            }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Built to respect your time
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              Quandr3s are short by design. You’re here to decide and move on
              with your life—not to doomscroll.
            </p>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: "#fff7f5",
              border: "1px solid rgba(248, 113, 113, 0.25)",
            }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Designed with care
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              Safety, transparency, and clear community rules are core to the
              product. We’d rather grow slower and healthier than faster and
              chaotic.
            </p>
          </div>
        </div>
      </section>

      {/* Founder / vision teaser */}
      <section>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          Where we’re headed
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 700,
            color: "#1f2933",
          }}
        >
          Quandr3 is starting with everyday decisions, but the long-term vision
          is bigger: a global map of real-world choices and outcomes that helps
          people, families, and communities move from confusion to clarity.
        </p>
      </section>
    </main>
  );
}
