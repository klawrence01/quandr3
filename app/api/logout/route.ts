// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // TEMP: simple logout stub for scaffold phase.
  // Later we’ll hook this into Supabase to clear the real session.
  return NextResponse.redirect("/");
}
