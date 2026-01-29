// app/quandr3/lib/getQuandr3Feed.ts
// @ts-nocheck
import { createClient } from "@/utils/supabase/server";

export async function getQuandr3Feed(category?: string) {
  const supabase = createClient();

  const now = new Date().toISOString();

  let query = supabase
    .from("quandr3s")
    .select(
      `
      id,
      title,
      category,
      status,
      created_at,
      media_thumb_url,
      is_sponsored,
      sponsored_start,
      sponsored_end,
      poster_username
    `
    )
    .eq("status", "OPEN");

  if (category) {
    query = query.eq("category", category);
  }

  // Only treat as "active sponsored" if we're inside the window
  query = query
    .or(
      [
        // Active sponsored window
        `and(is_sponsored.eq.true,sponsored_start.lte.${now},or(sponsored_end.is.null,sponsored_end.gte.${now}))`,
        // Or not sponsored at all
        `is_sponsored.eq.false`
      ].join(",")
    )
    .order("is_sponsored", { ascending: false }) // sponsored first
    .order("created_at", { ascending: false });  // newest within each group

  const { data, error } = await query;

  if (error) {
    console.error("Feed query error:", error);
    throw error;
  }

  return data ?? [];
}
