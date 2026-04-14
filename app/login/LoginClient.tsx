"use client";
// @ts-nocheck

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const PENDING_PROFILE_KEY = "q3_pending_profile";

function LoginClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referrer, setReferrer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref") || "";
    setReferrer(ref);
  }, [searchParams]);

  async function applyPendingProfile(user: any) {
    if (typeof window === "undefined") return false;

    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.display_name) payload.display_name = data.display_name;
      if (data.city) payload.city = data.city;
      if (data.state) payload.state = data.state;
      if (data.referred_by) payload.referred_by = data.referred_by;

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update failed:", error.message);
        return false;
      }

      localStorage.removeItem(PENDING_PROFILE_KEY);
      console.log("Pending profile applied");
      return true;
    } catch {
      console.error("Invalid pending profile data");
      return false;
    }
  }

  async function handleSubmit() {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let completedProfile = false;

      if (user) {
        completedProfile = await applyPendingProfile(user);
      }

      if (completedProfile || searchParams.get("completeProfile") === "1") {
        router.push("/invite?welcome=1");
        return;
      }

      router.push("/explore");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Password reset email sent. Check your inbox.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 border rounded-xl">
      <h1 className="text-xl font-bold mb-4">Login</h1>

      {referrer && (
        <div className="mb-3 bg-green-100 border border-green-300 p-2 text-sm rounded">
          Referral detected
        </div>
      )}

      {searchParams.get("completeProfile") === "1" && (
        <div className="mb-3 bg-blue-50 border border-blue-200 p-2 text-sm rounded">
          Log in to finish setting up your profile.
        </div>
      )}

      <input
        type="email"
        className="border p-2 w-full mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border p-2 w-full mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white w-full py-2 rounded disabled:opacity-50"
      >
        {loading ? "Please wait..." : "Login"}
      </button>

      <button
        onClick={handleForgotPassword}
        disabled={loading}
        className="mt-3 text-sm underline"
      >
        Forgot Password?
      </button>

      <button
        onClick={() => router.push("/signup")}
        disabled={loading}
        className="mt-3 text-sm underline block"
      >
        Need an account? Sign up
      </button>
    </div>
  );
}

export default function LoginClient() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto p-6 border rounded-xl">
          <h1 className="text-xl font-bold mb-4">Login</h1>
          <p className="text-sm text-gray-600">Loading login...</p>
        </div>
      }
    >
      <LoginClientInner />
    </Suspense>
  );
}