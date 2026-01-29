// app/test/[slug]/page.tsx

export default function TestSlugPage({ params }: any) {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
        TEST ROUTE
      </h1>

      <p>Raw params from Next:</p>

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        }}
      >
        {JSON.stringify(params, null, 2)}
      </pre>
    </main>
  );
}
