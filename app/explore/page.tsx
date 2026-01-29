import { Suspense } from "react";
import ExploreInner from "./_ExploreInner";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <ExploreInner />
    </Suspense>
  );
}
