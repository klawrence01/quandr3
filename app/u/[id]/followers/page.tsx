// /app/u/[id]/followers/page.tsx
"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import FollowersInner from "./_FollowersInner";

export default function FollowersPage() {
  return <FollowersInner />;
}
