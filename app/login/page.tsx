// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

type Profile = {
  id: string;
  username: string | null;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("Checking session...");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function check() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        setStatus("Error checking session.");
        return;
      }

      if (!user) {
        setStatus("You are NOT signed in yet.");
        return;
      }

      setStatus(`Signed in as ${user.email ?? user.id}`);
    }

    check();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("Signing in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      setStatus("Sign in failed.");
      return;
    }

    setStatus(`Signed in as ${data.user?.email ?? data.user?.id}`);
  }

  async function goToMyProfile() {
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You are not signed in. Sign in first.");
      return;
    }

    // assumes profiles.id = auth.user.id and has username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (profileError) {
      console.error(profileError);
      setError("Could not load your profile.");
      return;
    }

    if (!profile || !profile.username) {
      setError("Profile exists but username is missing.");
      return;
    }

    router.push(`/u/${profile.username}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        fontFamily: "system-ui",
        background: "#f9fafb",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>
          Account
        </h1>
        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
          Use this page to sign in and jump straight to your own profile.
        </p>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#eef2ff",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <strong>Status:</strong> {status}
        </div>

        <button
          type="button"
          onClick={goToMyProfile}
          style={{
            marginBottom: 20,
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            background: "#1e63f3",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Go to my profile
        </button>

        {error && (
          <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 4 }}>
            {error}
          </p>
        )}

        <hr style={{ margin: "24px 0" }} />

        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          Sign in
        </h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#0b2343",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
