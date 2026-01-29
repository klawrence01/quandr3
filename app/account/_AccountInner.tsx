"use client";
// @ts-nocheck

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

export default function AccountInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Example: /account?next=/q/123 (optional)
  const next = sp?.get("next") || "/explore";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoading(false);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <div>Loading…</div>;

  if (!user) {
    return (
      <div>
        <p>You’re not logged in.</p>
        <Link href={`/login?next=/account`}>Go to login</Link>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Signed in</div>
      <div style={{ color: "#444" }}>
        {user.email ?? "Email unavailable"}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/profile">Go to Profile</Link>
        <Link href={next}>Back</Link>
        <button onClick={logout}>Log out</button>
      </div>
    </div>
  );
}
