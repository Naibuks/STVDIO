"use client";

import { use } from "react";
import MessageThread from "@/components/MessageThread";
import { useMessagesLayout } from "@/components/MessagesContext";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { onRead } = useMessagesLayout();

  return <MessageThread conversationId={conversationId} onRead={onRead} />;
}
