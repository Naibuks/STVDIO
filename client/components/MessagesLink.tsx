"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useSocket } from "./SocketProvider";
import { getUnreadTotal } from "@/services/conversations";

/**
 * Header link with an unread badge.
 *
 * The count is fetched once on sign-in and then kept live by the socket: a
 * `conversation:updated` arrives on the user's personal room for any message
 * they receive, whether or not the thread is open, so the badge does not need
 * polling.
 */
export default function MessagesLink() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(
    () =>
      Promise.resolve()
        .then(() => getUnreadTotal())
        .then((data) => setUnread(data.unread))
        .catch(() => setUnread(0)),
    [],
  );

  useEffect(() => {
    // Deferred so no state is written synchronously inside the effect.
    if (!user) {
      Promise.resolve().then(() => setUnread(0));
      return;
    }
    refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!socket || !user) return;

    // Refetching is cheaper to reason about than mirroring the server's
    // per-conversation arithmetic on the client.
    const onUpdate = () => refresh();
    socket.on("conversation:updated", onUpdate);
    socket.on("message:read:update", onUpdate);

    return () => {
      socket.off("conversation:updated", onUpdate);
      socket.off("message:read:update", onUpdate);
    };
  }, [socket, user, refresh]);

  if (!user) return null;

  return (
    <Link href="/messages" className="relative hover:opacity-60">
      Messages
      {unread > 0 && (
        <span className="ml-1.5 inline-block bg-current px-1.5 py-0.5 font-mono text-[0.55rem] leading-none text-neutral-100 dark:text-neutral-900">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
