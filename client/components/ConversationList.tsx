"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import SafeImage from "./SafeImage";
import { useSocket } from "./SocketProvider";
import { getConversations } from "@/services/conversations";
import type { Conversation, NewMessageEvent } from "@/types/api";

/** "now", "14:32", "12 Aug" — compact enough for a narrow inbox column. */
const timeLabel = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/**
 * The inbox column.
 *
 * State is lifted to the page so the list and the open thread stay in step —
 * reading a conversation must clear its badge here immediately.
 */
export default function ConversationList({
  conversations,
  setConversations,
  activeId,
}: {
  conversations: Conversation[] | null;
  setConversations: (
    update: (current: Conversation[] | null) => Conversation[] | null,
  ) => void;
  activeId?: string;
}) {
  const { socket, isOnline } = useSocket();

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getConversations())
        .then((data) => setConversations(() => data.conversations))
        .catch(() => setConversations(() => [])),
    [setConversations],
  );

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Any incoming message reorders the inbox and bumps the badge — including
   * for threads that are not open, which is what `conversation:updated`
   * (sent to the user's personal room) exists for.
   */
  useEffect(() => {
    if (!socket) return;

    const bump = ({ conversationId, message }: NewMessageEvent) => {
      setConversations((current) => {
        if (!current) return current;
        const index = current.findIndex((c) => c._id === conversationId);
        if (index === -1) return current;

        const conversation = current[index];
        const isActive = conversationId === activeId;
        const fromMe = message.sender._id === conversation.participant?._id;

        const updated: Conversation = {
          ...conversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          // Only count messages from the other person, and only when the
          // thread is not already on screen.
          unreadCount:
            fromMe && !isActive
              ? conversation.unreadCount + 1
              : conversation.unreadCount,
        };

        const rest = current.filter((c) => c._id !== conversationId);
        return [updated, ...rest];
      });
    };

    socket.on("message:new", bump);
    socket.on("conversation:updated", (payload: { conversationId: string; lastMessage: NewMessageEvent["message"] }) =>
      bump({ conversationId: payload.conversationId, message: payload.lastMessage }),
    );

    return () => {
      socket.off("message:new", bump);
      socket.off("conversation:updated");
    };
  }, [socket, activeId, setConversations]);

  if (conversations === null) {
    return (
      <p className="px-6 py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
        Loading…
      </p>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="px-6 py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
        No conversations yet. Open someone&rsquo;s profile to start one.
      </p>
    );
  }

  return (
    <ul>
      {conversations.map((conversation) => {
        const other = conversation.participant;
        const active = conversation._id === activeId;
        const online = isOnline(other?._id) || conversation.isParticipantOnline;

        return (
          <li key={conversation._id}>
            <Link
              href={`/messages/${conversation._id}`}
              className={`flex items-start gap-3 border-b border-[#1d1d1d] px-6 py-4 transition ${
                active ? "bg-[#111111]" : "hover:bg-[#111111]"
              }`}
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#111111]">
                <SafeImage
                  src={other?.avatar?.url}
                  alt={other?.name ?? "Unknown"}
                  className="h-full w-full object-cover"
                  fallback={
                    <span className="flex h-full items-center justify-center text-xs font-medium text-[#f5f1ea]/40">
                      {other?.name?.charAt(0) ?? "?"}
                    </span>
                  }
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-[#f5f1ea]">
                    {other?.name ?? "Unknown"}
                    {online && (
                      <span
                        aria-label="online"
                        className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#d66a38] align-middle"
                      />
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[0.52rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
                    {timeLabel(conversation.lastMessageAt)}
                  </span>
                </span>

                <span className="mt-1 flex items-baseline justify-between gap-3">
                  <span
                    className={`truncate text-xs ${
                      conversation.unreadCount > 0
                        ? "text-[#f5f1ea]/80"
                        : "text-[#f5f1ea]/45"
                    }`}
                  >
                    {conversation.lastMessage?.content ?? "No messages yet"}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="shrink-0 bg-[#d66a38] px-1.5 py-0.5 font-mono text-[0.52rem] text-[#080808]">
                      {conversation.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
