"use client";

/**
 * /messages — the empty state beside the inbox.
 *
 * The conversation list itself lives in the layout, so on mobile this route
 * shows only the list and this panel is hidden.
 */
export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#080808] px-6 py-20 text-[#f5f1ea]">
      <div className="max-w-md border border-[#1d1d1d] bg-[#0d0d0d] p-8 text-center">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.34em] text-[#f5f1ea]/45">
          Studio inbox
        </p>
        <p className="mt-5 text-lg leading-relaxed text-[#f5f1ea]/75">
          Select a conversation, or open a creative&rsquo;s profile to start one.
        </p>
      </div>
    </div>
  );
}
