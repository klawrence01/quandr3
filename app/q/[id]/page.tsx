// /app/q/[id]/page.tsx
export const dynamic = "force-dynamic";

import VoteClient from "./VoteClient";

export default function Quandr3DetailPage() {
  return <VoteClient />;
}