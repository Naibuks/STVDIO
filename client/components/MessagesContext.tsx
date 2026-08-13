"use client";

import { createContext, useContext } from "react";

/**
 * Lets an open thread tell the inbox list it has been read, so the badge
 * clears immediately instead of waiting for the next fetch.
 *
 * Its own module rather than living in the layout: a Next layout file should
 * export a component, not hooks.
 */
const MessagesContext = createContext<{
  onRead: (conversationId: string) => void;
}>({ onRead: () => {} });

export const MessagesProvider = MessagesContext.Provider;

export const useMessagesLayout = () => useContext(MessagesContext);
