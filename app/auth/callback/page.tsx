"use client";
// @ts-nocheck

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const next = sp.get("next") || "/explore";

      // Confirm session from magic link
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const user = data?.session?.user;
      if (!user?.id) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      // Apply referral (only once)
      const ref =
        localStorage.getItem("q_referrer") ||
        sessionStorage.getItem("q_referrer");

      if (ref) {
        await supabase
          .from("profiles")
          .update({ referred_by: ref })
          .eq("id", user.id)
          .is("referred_by", null);

        localStorage.removeItem("q_referrer");
        sessionStorage.removeItem("q_referrer");
      }

      router.replace(next);
    })();
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center", fontWeight: 900 }}>
      Logging you in…
    </div>
  );
}