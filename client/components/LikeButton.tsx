"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { likeProject, unlikeProject } from "@/services/likes";

/**
 * Like / unlike control.
 *
 * Anonymous visitors still see the count; clicking sends them to sign in.
 * The count updates optimistically and rolls back if the request fails, so a
 * dropped connection cannot leave the UI claiming a like that never landed.
 */
export default function LikeButton({
  projectId,
  initialCount,
  initialLiked = false,
  size = "default",
}: {
  projectId: string;
  initialCount: number;
  initialLiked?: boolean;
  size?: "default" | "small";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (busy) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    setBusy(true);

    try {
      const result = nextLiked
        ? await likeProject(projectId)
        : await unlikeProject(projectId);
      // Trust the server's number over the optimistic guess.
      setCount(result.likesCount);
      setLiked(result.likedByMe);
    } catch {
      setLiked(!nextLiked);
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  const small = size === "small";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this project" : "Like this project"}
      className={`inline-flex items-center gap-2 border transition disabled:opacity-50 ${
        small ? "px-2 py-1" : "px-3 py-2"
      } ${
        liked
          ? "border-current bg-current/10"
          : "border-current/30 hover:border-current/60"
      }`}
    >
      <span aria-hidden className={small ? "text-xs" : "text-sm"}>
        {liked ? "★" : "☆"}
      </span>
      <span
        className={`font-mono uppercase tracking-widest ${
          small ? "text-[0.55rem]" : "text-[0.65rem]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
