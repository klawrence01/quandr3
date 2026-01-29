import { Suspense } from "react";
import AccountInner from "./_AccountInner";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Account</h1>

      <Suspense fallback={<div>Loading account…</div>}>
        <AccountInner />
      </Suspense>
    </main>
  );
}
