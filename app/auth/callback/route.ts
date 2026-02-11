// app/auth/callback/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/explore";
  return NextResponse.redirect(new URL(next, url.origin));
}
