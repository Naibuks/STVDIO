"use client";

import { useState } from "react";
import Link from "next/link";
import FollowButton from "./FollowButton";
import SafeImage from "./SafeImage";
import { formatCategory } from "@/lib/format";
import type { User } from "@/types/api";

/** A creative in a discovery grid or a followers list. */
export default function UserCard({
  user,
  isFollowing = false,
}: {
  user: User;
  isFollowing?: boolean;
}) {
  const [followers, setFollowers] = useState(user.followersCount);

  return (
    <article className="flex items-start gap-4 border-t border-current/15 py-5">
      <Link
        href={`/profile/${user.username}`}
        className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-current/10"
      >
        <SafeImage
          src={user.avatar?.url}
          alt={user.name}
          className="h-full w-full object-cover"
          fallback={
            <span className="flex h-full items-center justify-center text-sm font-medium text-current/30">
              {user.name.charAt(0)}
            </span>
          }
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${user.username}`}
          className="text-sm font-medium hover:opacity-60"
        >
          {user.name}
        </Link>
        <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          @{user.username} · {user.role}
          {user.location ? ` · ${user.location}` : ""}
        </p>

        {user.categories?.length > 0 && (
          <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            {user.categories.map(formatCategory).join(" · ")}
          </p>
        )}

        {user.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-current/70">{user.bio}</p>
        )}

        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {followers} follower{followers === 1 ? "" : "s"} ·{" "}
          {user.projectsCount} project{user.projectsCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="shrink-0">
        <FollowButton
          username={user.username}
          initialFollowing={isFollowing}
          initialFollowers={user.followersCount}
          onCountChange={setFollowers}
        />
      </div>
    </article>
  );
}
