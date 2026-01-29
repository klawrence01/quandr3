// app/api/quandr3s/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/utils/supabase/server";

// Create a new Quandr3 + its options (A–D)
export async function POST(request: Request) {
  const supabase = getServerSupabase();
  const body = await request.json();

  const {
    title,
    context,
    category,
    city,
    country,
    timeLimitHours,
    optionA,
    optionB,
    optionC,
    optionD,
    mediaMode, // not stored yet, but kept for future use
    mediaUrl,
  } = body;

  // Get current user (Curioso)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // 1) Insert the Quandr3 itself
  const { data: quandr3, error: qError } = await supabase
    .from("quandr3s")
    .insert({
      author_id: user.id,
      title,
      context,
      category,
      city,
      country,
      time_limit_hours: timeLimitHours ?? null,
      status: "open",
      visibility: "public",
      media_url: mediaUrl ?? null,
    })
    .select("id")
    .single();

  if (qError || !quandr3) {
    console.error("quandr3 insert error", qError);
    return NextResponse.json(
      { error: "Failed to create Quandr3" },
      { status: 500 }
    );
  }

  // 2) Insert options A–D
  const optionsPayload = [
    { label: "A", text: optionA },
    { label: "B", text: optionB },
    optionC ? { label: "C", text: optionC } : null,
    optionD ? { label: "D", text: optionD } : null,
  ].filter(Boolean) as { label: "A" | "B" | "C" | "D"; text: string }[];

  if (optionsPayload.length) {
    const { error: optError } = await supabase.from("options").insert(
      optionsPayload.map((o) => ({
        quandr3_id: quandr3.id,
        label: o.label,
        text: o.text,
        status: "curioso",
      }))
    );

    if (optError) {
      console.error("options insert error", optError);
      // v1: we log but keep the Quandr3; later we can add rollback if needed
    }
  }

  return NextResponse.json({ id: quandr3.id }, { status: 201 });
}
