"use client";
// @ts-nocheck

import { useParams } from "next/navigation";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default function UsernameProfilePage() {
  const params = useParams();
  const username = params?.username ? String(params.username) : "";

  // ProfileClient should accept either username or id.
  return <ProfileClient handle={username} />;
}
