// /utils/referrals.ts
// @ts-nocheck

import type { SupabaseClient } from "@supabase/supabase-js";

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function isUuid(s?: string) {
  const v = safeStr(s);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

const KEY = "q3_ref"; // localStorage key

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const ref =
      url.searchParams.get("ref") ||
      url.searchParams.get("r") ||
      url.searchParams.get("referral");

    if (ref && isUuid(ref)) {
      localStorage.setItem(KEY, ref);
    }
  } catch {
    // ignore
  }
}

export async function finalizeReferralIfAny(
  supabase: SupabaseClient,
  myUserId?: string | null
) {
  if (typeof window === "undefined") return;
  const me = safeStr(myUserId);
  if (!isUuid(me)) return;

  const inviter = safeStr(localStorage.getItem(KEY));
  if (!isUuid(inviter)) return;

  // never refer yourself
  if (inviter === me) {
    localStorage.removeItem(KEY);
    return;
  }

  try {
    // 1) Insert referral row (unique pair prevents duplicates)
    await supabase.from("referrals").insert({
      inviter_id: inviter,
      invitee_id: me,
    });

    // 2) Set profiles.referred_by ONLY if it's currently null
    // (we read current value first to avoid overwriting)
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, referred_by")
      .eq("id", me)
      .maybeSingle();

    if (prof?.id && !prof?.referred_by) {
      await supabase.from("profiles").update({ referred_by: inviter }).eq("id", me);
    }

    // clear after success
    localStorage.removeItem(KEY);
  } catch {
    // don't spam errors; we'll just try again next load
  }
}