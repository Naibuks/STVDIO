"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ConversationList from "@/components/ConversationList";
import { MessagesProvider } from "@/components/MessagesContext";
import type { Conversation } from "@/types/api";

/**
 * Two-pane inbox.
 *
 * Desktop keeps the list beside the open thread. On mobile there is not room
 * for both, so the list is hidden once a conversation is open and the thread's
 * back arrow returns to it — two screens rather than two columns.
 *
 * The list lives in the layout so it survives navigation between threads
 * instead of refetching on every click.
 */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // null on /messages, the id on /messages/[conversationId].
  const activeId = useSelectedLayoutSegment();

  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  /** Clears a thread's badge the moment it is opened or read. */
  const handleRead = useCallback((conversationId: string) => {
    setConversations((current) =>
      (current ?? []).map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, []);

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[#f5f1ea]/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 bg-[#080808] text-[#f5f1ea] lg:h-[calc(100vh-4.5rem)]">
      <aside
        className={`w-full shrink-0 border-[#1d1d1d] lg:block lg:w-[22rem] lg:border-r ${
          activeId ? "hidden" : "block"
        }`}
      >
        <header className="border-b border-[#1d1d1d] px-6 py-5">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f5f1ea]/55">
            Studio inbox
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[#f5f1ea]">
            Conversations
          </h1>
        </header>
        <div className="overflow-y-auto lg:h-[calc(100%-6.2rem)]">
          <ConversationList
            conversations={conversations}
            setConversations={setConversations}
            activeId={activeId ?? undefined}
          />
        </div>
      </aside>

      <section
        className={`min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden lg:flex"}`}
      >
        <MessagesProvider value={{ onRead: handleRead }}>
          {children}
        </MessagesProvider>
      </section>
    </main>
  );
}
