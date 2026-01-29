// app/privacy/page.tsx

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
        This page will explain what data Quandr3 collects, how it’s used, and
        the choices you have. Right now it’s a clean placeholder so the route
        is ready.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563" }}>
        Later we’ll divide this into clear sections: data we collect, how
        decisions and votes are stored, how long we keep information, how you
        can request deletion, and how we handle cookies and analytics.
      </p>
    </main>
  );
}
