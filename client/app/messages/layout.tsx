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
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 lg:h-[calc(100vh-4.5rem)]">
      <aside
        className={`w-full shrink-0 border-current/15 lg:block lg:w-80 lg:border-r ${
          activeId ? "hidden" : "block"
        }`}
      >
        <header className="border-b border-current/15 px-6 py-5">
          <h1 className="text-xl font-medium tracking-tight">Messages</h1>
        </header>
        <div className="overflow-y-auto lg:h-[calc(100%-5rem)]">
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
