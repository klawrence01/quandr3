"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

export default function FollowButton({ profileId }: { profileId: string }) {
  const [meId, setMeId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!mounted) return;

      setMeId(uid);

      if (uid && uid !== profileId) {
        const { data: row } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", uid)
          .eq("following_id", profileId)
          .maybeSingle();

        if (mounted) setFollowing(!!row);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [profileId]);

  async function toggleFollow(e?: any) {
    e?.stopPropagation?.();

    if (!meId || meId === profileId || loading) return;
    setLoading(true);

    try {
      if (following) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", meId)
          .eq("following_id", profileId);

        setFollowing(false);
      } else {
        await supabase.from("follows").insert({
          follower_id: meId,
          following_id: profileId,
        });

        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!meId || meId === profileId) return null;

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className="rounded-full border px-3 py-1 text-xs font-medium bg-white"
    >
      {following ? "Following" : "+ Follow"}
    </button>
  );
}