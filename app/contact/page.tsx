// app/support/page.tsx

export default function SupportPage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "64px 24px 96px",
        fontFamily: "system-ui",
        color: "#0b2343",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 900,
          marginBottom: 16,
        }}
      >
        Support & Contact
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
        Stuck, spotted a bug, or have feedback about Quandr3? This page gives
        people a single home base for getting help.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          For app issues
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563" }}>
          Add your preferred contact path here (support email, in-app form, or
          ticket system). For now, this is just a placeholder with a clean URL:
          <code style={{ marginLeft: 4 }}>/support</code>.
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          For partnership or press
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563" }}>
          Later we can add sections here for brand partnerships, experts who
          want to host sponsored Quandr3s, and press inquiries.
        </p>
      </section>
    </main>
  );
}
