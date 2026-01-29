import { Suspense } from "react";
import RegisterInner from "./_RegisterInner";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <RegisterInner />
    </Suspense>
  );
}
