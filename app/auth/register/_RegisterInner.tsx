"use client";
// @ts-nocheck

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

export default function RegisterInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = useMemo(() => sp?.get("next") || "/explore", [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function register(e: any) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      setMsg("Account created ✅ Check your email if confirmation is required.");
      router.push(next);
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/login">Back to Login</Link>
        <Link href="/explore">Explore</Link>
      </div>

      <h1 style={{ marginTop: 16 }}>Create account</h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        You’ll be redirected to: <code>{next}</code>
      </p>

      <form onSubmit={register} style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </div>
      </form>

      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </main>
  );
}
