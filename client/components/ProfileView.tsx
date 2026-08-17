"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectGrid from "./ProjectGrid";
import FollowButton from "./FollowButton";
import MessageButton from "./MessageButton";
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
    <div className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-[#1d1d1d] pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#111111]">
                <SafeImage
                  src={user.avatar?.url}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full items-center justify-center text-2xl font-medium text-[#f5f1ea]/35">
                      {user.name.charAt(0)}
                    </div>
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-4xl font-medium tracking-[-0.08em] text-[#f5f1ea] sm:text-5xl">
                    {user.name}
                  </h1>
                  {user.isVerified && (
                    <span className="font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f7c1a4]">
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#f5f1ea]/55">
                  @{user.username} · {user.role}
                  {user.location ? ` · ${user.location}` : ""}
                </p>

                {user.bio && (
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#f5f1ea]/72">
                    {user.bio}
                  </p>
                )}

                {user.categories.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {user.categories.map((c) => (
                      <li
                        key={c}
                        className="border border-[#2a2a2a] bg-[#111111] px-2.5 py-2 font-mono text-[0.52rem] uppercase tracking-[0.22em] text-[#f5f1ea]/55"
                      >
                        {formatCategory(c)}
                      </li>
                    ))}
                  </ul>
                )}

                {user.skills.length > 0 && (
                  <p className="mt-5 text-sm leading-relaxed text-[#f5f1ea]/60">
                    {user.skills.join(" · ")}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.56rem] uppercase tracking-[0.22em]">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[#f5f1ea]/70 underline decoration-[#d66a38]/60 underline-offset-4 hover:text-[#f5f1ea]"
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
                      className="text-[#f5f1ea]/70 underline decoration-[#d66a38]/60 underline-offset-4 hover:text-[#f5f1ea]"
                    >
                      {key}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
              {isOwner ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 transition hover:border-[#d66a38]"
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/portfolio/new"
                    className="border border-[#d66a38] bg-[#d66a38]/10 px-4 py-2.5 text-[#f7c1a4] transition hover:bg-[#d66a38]/15"
                  >
                    New work
                  </Link>
                </>
              ) : (
                <>
                  <MessageButton username={user.username} />
                  <FollowButton
                    username={user.username}
                    initialFollowing={isFollowing}
                    initialFollowers={user.followersCount}
                    onCountChange={setFollowers}
                  />
                </>
              )}
            </div>
          </div>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-[#1d1d1d] pt-6 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
            <div>
              <dt className="text-[#f5f1ea]/45">Projects</dt>
              <dd className="mt-2 text-xl text-[#f5f1ea]">{user.projectsCount}</dd>
            </div>
            <div>
              <dt className="text-[#f5f1ea]/45">Followers</dt>
              <dd className="mt-2 text-xl text-[#f5f1ea]">
                <Link href={`/profile/${user.username}/followers`} className="hover:text-[#f7c1a4]">
                  {followers}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[#f5f1ea]/45">Following</dt>
              <dd className="mt-2 text-xl text-[#f5f1ea]">
                <Link href={`/profile/${user.username}/following`} className="hover:text-[#f7c1a4]">
                  {user.followingCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[#f5f1ea]/45">Joined</dt>
              <dd className="mt-2 text-xl text-[#f5f1ea]">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </header>

        <section className="pt-10">
          <h2 className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
            Portfolio — {projects.length}
          </h2>
          <ProjectGrid
            projects={projects}
            // A portfolio is scanned as a whole, so keep the tiles compact.
            frame="square"
            emptyMessage={
              isOwner
                ? "You have not published any work yet."
                : "No published work yet."
            }
          />
        </section>
      </div>
    </div>
  );
}
