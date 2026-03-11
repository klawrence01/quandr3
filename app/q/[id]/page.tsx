// /app/q/[id]/page.tsx
export const dynamic = "force-dynamic";

import VoteClient from "./VoteClient";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function Quandr3DetailPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <VoteClient serverUserId={user?.id ?? ""} />;
}