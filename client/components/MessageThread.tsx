"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SafeImage from "./SafeImage";
import { useAuth } from "./AuthProvider";
import { useSocket } from "./SocketProvider";
import {
  getConversation,
  getMessages,
  markConversationRead,
  sendMessage as sendMessageRest,
} from "@/services/conversations";
import type {
  ChatMessage,
  Conversation,
  NewMessageEvent,
  ReadUpdateEvent,
} from "@/types/api";

const MAX_LENGTH = 5000;

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * One open conversation.
 *
 * History comes over REST; the socket carries only live updates. Sending
 * prefers the socket and falls back to REST when it is not connected — both
 * reach the same service, so the message is persisted either way and appears
 * for the other side identically.
 */
export default function MessageThread({
  conversationId,
  onRead,
}: {
  conversationId: string;
  /** Lets the inbox clear this thread's badge the moment it is opened. */
  onRead?: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const { socket, status, isOnline } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /** History is fetched newest-first, so each page is reversed for display. */
  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() =>
          Promise.all([
            getConversation(conversationId),
            getMessages(conversationId, 1, 30),
          ]),
        )
        .then(([conv, page1]) => {
          setConversation(conv.conversation);
          setMessages([...page1.messages].reverse());
          setHasMore(page1.hasMore);
          setPage(1);
          setError(null);
        })
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : "Could not open conversation",
          ),
        ),
    [conversationId],
  );

  useEffect(() => {
    load();
  }, [load]);

  /** Join the room, listen, and leave on unmount so rooms do not accumulate. */
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("conversation:join", { conversationId });

    const onNew = ({ conversationId: id, message }: NewMessageEvent) => {
      if (id !== conversationId) return;
      setMessages((current) => {
        if (!current) return [message];
        // The sender also receives its own broadcast; skip if already present.
        if (current.some((m) => m._id === message._id)) return current;
        return [...current, message];
      });
      // Reading it as it arrives keeps the unread count honest.
      socket.emit("message:read", { conversationId });
      onRead?.(conversationId);
    };

    const onRead2 = ({ conversationId: id, readBy }: ReadUpdateEvent) => {
      if (id !== conversationId || readBy === user?._id) return;
      setMessages((current) =>
        (current ?? []).map((m) =>
          m.sender._id === user?._id ? { ...m, read: true } : m,
        ),
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:read:update", onRead2);

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onNew);
      socket.off("message:read:update", onRead2);
    };
  }, [socket, conversationId, user?._id, onRead]);

  /** Opening a thread marks the other person's messages read. */
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId)
      .then(() => onRead?.(conversationId))
      .catch(() => {});
  }, [conversationId, onRead]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const loadOlder = async () => {
    const next = page + 1;
    const older = await getMessages(conversationId, next, 30);
    setMessages((current) => [...[...older.messages].reverse(), ...(current ?? [])]);
    setHasMore(older.hasMore);
    setPage(next);
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    try {
      if (socket && status === "connected") {
        const ack = await socket
          .timeout(8000)
          .emitWithAck("message:send", { conversationId, content })
          .catch(() => null);

        // A socket that acknowledges failure, or does not answer, falls back
        // to REST rather than silently dropping the message.
        if (!ack?.success) {
          if (ack && ack.success === false) throw new Error(ack.message);
          const { message } = await sendMessageRest(conversationId, content);
          setMessages((current) =>
            current?.some((m) => m._id === message._id)
              ? current
              : [...(current ?? []), message],
          );
        }
      } else {
        const { message } = await sendMessageRest(conversationId, content);
        setMessages((current) =>
          current?.some((m) => m._id === message._id)
            ? current
            : [...(current ?? []), message],
        );
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter is a newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(event as unknown as React.FormEvent);
    }
  };

  const other = conversation?.participant;
  const online = isOnline(other?._id) || conversation?.isParticipantOnline;

  if (error && !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-current/15 px-6 py-4">
        <Link
          href="/messages"
          className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50 hover:opacity-70 lg:hidden"
        >
          ←
        </Link>
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-current/10">
          <SafeImage
            src={other?.avatar?.url}
            alt={other?.name ?? ""}
            className="h-full w-full object-cover"
            fallback={
              <span className="flex h-full items-center justify-center text-xs font-medium text-current/30">
                {other?.name?.charAt(0) ?? "?"}
              </span>
            }
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {other ? (
              <Link
                href={`/profile/${other.username}`}
                className="hover:opacity-60"
              >
                {other.name}
              </Link>
            ) : (
              "Conversation"
            )}
          </p>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
            {online ? "Online" : "Offline"}
            {status !== "connected" && " · reconnecting"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {hasMore && (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={loadOlder}
              className="border border-current/30 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5"
            >
              Load earlier
            </button>
          </div>
        )}

        {messages === null && (
          <p className="font-mono text-xs uppercase tracking-widest text-current/40">
            Loading…
          </p>
        )}

        {messages?.length === 0 && (
          <p className="font-mono text-xs uppercase tracking-widest text-current/40">
            No messages yet — say something.
          </p>
        )}

        <ul className="space-y-4">
          {messages?.map((message) => {
            const mine = message.sender._id === user?._id;
            return (
              <li
                key={message._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                  {/* Rendered as text by React — never dangerouslySetInnerHTML. */}
                  <p
                    className={`whitespace-pre-wrap border px-4 py-3 text-sm leading-relaxed ${
                      mine
                        ? "border-current/30 bg-current/5"
                        : "border-current/15"
                    }`}
                  >
                    {message.content}
                  </p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-current/30">
                    {timeLabel(message.createdAt)}
                    {mine && (message.read ? " · Read" : " · Sent")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="border-t border-current/15 px-6 py-4"
      >
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Write a message…"
            className="max-h-40 flex-1 resize-y border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
