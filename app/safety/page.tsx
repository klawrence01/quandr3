// app/safety/page.tsx

export default function SafetyPage() {
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
        Safety & Community Guidelines
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
        Quandr3 is built for honest, respectful decision-making. This page will
        spell out the core rules for how we treat each other on the platform.
      </p>
      <ul
        style={{
          fontSize: 14,
          lineHeight: 1.8,
          color: "#4b5563",
          paddingLeft: 20,
        }}
      >
        <li>No harassment, hate, or personal attacks.</li>
        <li>No doxxing or sharing private information.</li>
        <li>Stay on topic and answer the actual Quandr3 being asked.</li>
        <li>Disagree with ideas, not people.</li>
        <li>Report harmful or dangerous content so our team can review it.</li>
      </ul>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563", marginTop: 16 }}>
        As the product matures, we can connect this page directly to in-app
        reporting tools, support workflows, and any future moderation partners.
      </p>
    </main>
  );
}
