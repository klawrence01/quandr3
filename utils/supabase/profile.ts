"use client";

import { supabase } from "./browser";

export async function ensureProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, error: userError || new Error("Not logged in") };
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id);

  if (selectError) {
    return { user: null, error: selectError };
  }

  if (!existing || existing.length === 0) {
    const username =
      user.email?.split("@")[0] ??
      `user_${user.id.slice(0, 8).toLowerCase()}`;

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      avatar_url: null,
      status: "active",
    });

    if (insertError) {
      return { user: null, error: insertError };
    }
  }

  return { user, error: null };
}
