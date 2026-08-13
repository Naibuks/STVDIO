"use client";

/**
 * /messages — the empty state beside the inbox.
 *
 * The conversation list itself lives in the layout, so on mobile this route
 * shows only the list and this panel is hidden.
 */
export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <p className="max-w-xs text-center font-mono text-[0.65rem] uppercase leading-relaxed tracking-widest text-current/40">
        Select a conversation, or open a creative&rsquo;s profile to start one
      </p>
    </div>
  );
}
