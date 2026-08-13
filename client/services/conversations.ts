import { apiData, json } from "./api";
import type {
  ChatMessage,
  ConversationPayload,
  ConversationsPayload,
  MessagesPayload,
  UnreadPayload,
} from "@/types/api";

const base = (id: string) => `/conversations/${encodeURIComponent(id)}`;

export const getConversations = () =>
  apiData<ConversationsPayload>("/conversations");

export const getUnreadTotal = () =>
  apiData<UnreadPayload>("/conversations/unread");

/** Opens a thread with someone, returning the existing one if there is one. */
export const openConversation = (userId: string) =>
  apiData<{ conversation: ConversationPayload["conversation"]; created: boolean }>(
    "/conversations",
    { method: "POST", body: json({ userId }) },
  );

export const getConversation = (id: string) =>
  apiData<ConversationPayload>(base(id));

/** Newest first — the caller reverses each page to render oldest to newest. */
export const getMessages = (id: string, page = 1, limit = 30) =>
  apiData<MessagesPayload>(`${base(id)}/messages?page=${page}&limit=${limit}`);

/**
 * REST fallback for sending. The socket path is preferred when connected, but
 * both hit the same service, so a message sent this way still reaches open
 * sockets.
 */
export const sendMessage = (id: string, content: string) =>
  apiData<{ message: ChatMessage }>(`${base(id)}/messages`, {
    method: "POST",
    body: json({ content }),
  });

export const markConversationRead = (id: string) =>
  apiData<{ conversationId: string; markedRead: number }>(`${base(id)}/read`, {
    method: "PATCH",
  });
