"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

function InvitePageInner() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(0);
  const [checkedSession, setCheckedSession] = useState(false);

  const showWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    if (!user) {
      setCheckedSession(true);
      return;
    }

    setUser(user);

    const link = `${window.location.origin}/signup?ref=${user.id}`;
    setReferralLink(link);

    await getReferralCount(user.id);
    setCheckedSession(true);
  }

  async function getReferralCount(userId: string) {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", userId);

    if (!error) {
      setCount(count || 0);
    }
  }

  async function copyLink() {
    if (!referralLink) return;

    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!checkedSession) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Invite Friends</h1>
        <p className="text-sm text-gray-600">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Invite Friends</h1>

        <p className="text-sm text-gray-600 mb-6">
          You need to be logged in to invite friends and share your personal
          referral link.
        </p>

        <div className="flex gap-3 justify-center">
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
            Log In
          </a>

          <a href="/signup" className="border px-4 py-2 rounded">
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl">
      <h1 className="text-2xl font-bold mb-2">Invite Friends</h1>

      {showWelcome && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="font-semibold mb-1">Your account is ready.</div>
          <div className="text-sm text-gray-700">
            Know thoughtful people who would give strong reasoning or benefit
            from better perspective? Share your personal invite link below.
          </div>
        </div>
      )}

      <p className="mb-4 text-sm text-gray-600">
        Know someone who would benefit from better perspective or give strong
        reasoning? Share your link and invite them to Quandr3.
      </p>

      <div className="border p-3 rounded mb-3 break-all text-sm">
        {referralLink}
      </div>

      <button
        onClick={copyLink}
        disabled={!referralLink}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>

      <div className="mt-6 text-sm">
        <strong>People you’ve invited:</strong> {count}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl">
          <h1 className="text-2xl font-bold mb-2">Invite Friends</h1>
          <p className="text-sm text-gray-600">Loading invite page...</p>
        </div>
      }
    >
      <InvitePageInner />
    </Suspense>
  );
}