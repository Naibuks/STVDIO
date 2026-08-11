"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectGrid from "./ProjectGrid";
import FollowButton from "./FollowButton";
import SafeImage from "./SafeImage";
import { formatCategory, formatDate } from "@/lib/format";
import type { Project, User } from "@/types/api";

const SOCIAL_ORDER = [
  "instagram",
  "behance",
  "dribbble",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
] as const;

export default function ProfileView({
  user,
  projects,
  isOwner,
  isFollowing = false,
}: {
  user: User;
  projects: Project[];
  isOwner: boolean;
  isFollowing?: boolean;
}) {
  const socials = SOCIAL_ORDER.filter((key) => user.socialLinks?.[key]);
  // Held locally so the count moves the moment the follow succeeds.
  const [followers, setFollowers] = useState(user.followersCount);

  return (
    <div className="px-6 py-10 sm:px-10 sm:py-16">
      <header className="border-b border-current/15 pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-current/10">
            <SafeImage
              src={user.avatar?.url}
              alt={user.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full items-center justify-center text-2xl font-medium text-current/30">
                  {user.name.charAt(0)}
                </div>
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                {user.name}
              </h1>
              {user.isVerified && (
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
                  Verified
                </span>
              )}
            </div>

            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-current/50">
              @{user.username} · {user.role}
              {user.location ? ` · ${user.location}` : ""}
            </p>

            {user.bio && (
              <p className="mt-4 max-w-xl leading-relaxed text-current/80">
                {user.bio}
              </p>
            )}

            {user.categories.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {user.categories.map((c) => (
                  <li
                    key={c}
                    className="border border-current/20 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest"
                  >
                    {formatCategory(c)}
                  </li>
                ))}
              </ul>
            )}

            {user.skills.length > 0 && (
              <p className="mt-4 text-sm text-current/60">
                {user.skills.join(" · ")}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.65rem] uppercase tracking-widest">
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-4 hover:opacity-60"
                >
                  Website
                </a>
              )}
              {socials.map((key) => (
                <a
                  key={key}
                  href={user.socialLinks![key]}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-4 hover:opacity-60"
                >
                  {key}
                </a>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
            {isOwner ? (
              <>
                <Link
                  href="/profile/edit"
                  className="border border-current/30 px-3 py-2 hover:bg-current/5"
                >
                  Edit profile
                </Link>
                <Link
                  href="/portfolio/new"
                  className="border border-current px-3 py-2 hover:bg-current/5"
                >
                  New work
                </Link>
              </>
            ) : (
              <FollowButton
                username={user.username}
                initialFollowing={isFollowing}
                initialFollowers={user.followersCount}
                onCountChange={setFollowers}
              />
            )}
          </div>
        </div>

        <dl className="mt-8 flex gap-8 font-mono text-[0.65rem] uppercase tracking-widest">
          <div>
            <dt className="text-current/40">Projects</dt>
            <dd className="mt-1 text-base">{user.projectsCount}</dd>
          </div>
          <div>
            <dt className="text-current/40">Followers</dt>
            <dd className="mt-1 text-base">
              <Link
                href={`/profile/${user.username}/followers`}
                className="hover:opacity-60"
              >
                {followers}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-current/40">Following</dt>
            <dd className="mt-1 text-base">
              <Link
                href={`/profile/${user.username}/following`}
                className="hover:opacity-60"
              >
                {user.followingCount}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-current/40">Joined</dt>
            <dd className="mt-1 text-base">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </header>

      <section className="pt-10">
        <h2 className="mb-6 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          Portfolio — {projects.length}
        </h2>
        <ProjectGrid
          projects={projects}
          emptyMessage={
            isOwner
              ? "You have not published any work yet."
              : "No published work yet."
          }
        />
      </section>
    </div>
  );
}
