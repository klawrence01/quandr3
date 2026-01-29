import { Suspense } from "react";
import LoginInner from "./_LoginInner";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
