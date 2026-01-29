// app/terms/page.tsx

export default function TermsPage() {
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
        Terms of Use
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
        This page will outline the official terms for using Quandr3. For now,
        it’s a placeholder so the route exists and can be linked from footers,
        emails, and onboarding screens.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563" }}>
        Future sections will cover: eligibility, acceptable use, content
        ownership, moderation rules, limitation of liability, and how account
        closures work. When you’re ready, we can drop in full legal copy here.
      </p>
    </main>
  );
}
