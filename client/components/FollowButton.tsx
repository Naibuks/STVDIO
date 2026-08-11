"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { followUser, unfollowUser } from "@/services/follows";

/**
 * Follow / Following toggle.
 *
 * Renders nothing on your own profile — the server rejects a self-follow with
 * 400, and offering a button that cannot work is worse than hiding it.
 */
export default function FollowButton({
  username,
  initialFollowing,
  initialFollowers,
  onCountChange,
}: {
  username: string;
  initialFollowing: boolean;
  initialFollowers?: number;
  onCountChange?: (followersCount: number) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [hovering, setHovering] = useState(false);

  if (user?.username === username) return null;

  const onClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (busy) return;

    setBusy(true);
    const next = !following;
    setFollowing(next);

    try {
      const result = next
        ? await followUser(username)
        : await unfollowUser(username);
      setFollowing(result.following);
      onCountChange?.(result.followersCount);
    } catch {
      setFollowing(!next);
      if (initialFollowers !== undefined) onCountChange?.(initialFollowers);
    } finally {
      setBusy(false);
    }
  };

  const label = following ? (hovering ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={busy}
      aria-pressed={following}
      className={`border px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest transition disabled:opacity-50 ${
        following
          ? "border-current/30 text-current/60 hover:border-red-500/60 hover:text-red-500"
          : "border-current hover:bg-current/5"
      }`}
    >
      {label}
    </button>
  );
}
