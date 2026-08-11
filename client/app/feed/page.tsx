"use client";

import Feed from "@/components/Feed";

/** /feed — the public creative feed. Safe for anonymous visitors. */
export default function FeedPage() {
  return (
    <main className="px-6 py-12 sm:px-10">
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
          The Feed
        </h1>
        <p className="mt-2 max-w-md font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          New work from the STVDIO° community
        </p>
      </header>

      <Feed />
    </main>
  );
}
