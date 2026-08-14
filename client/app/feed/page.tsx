"use client";

import Feed from "@/components/Feed";

/** /feed — the public creative feed. Safe for anonymous visitors. */
export default function FeedPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-[#f3efe8] sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 border-b border-[#1d1d1d] pb-6">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f3efe8]/60">
            Creative culture
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[#f8f5f1] sm:text-3xl">
            Feed
          </h1>
        </header>

        <Feed />
      </div>
    </main>
  );
}
