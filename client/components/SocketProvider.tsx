"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/env";
import { getToken } from "@/lib/auth";
import { useAuth } from "./AuthProvider";

type Status = "idle" | "connecting" | "connected" | "error";

type SocketState = {
  socket: Socket | null;
  status: Status;
  error: string | null;
  /** User ids currently connected. Volatile — resets when the server restarts. */
  onlineUsers: Set<string>;
  isOnline: (userId?: string) => boolean;
};

const SocketContext = createContext<SocketState | null>(null);

/**
 * The socket origin is the API origin without the /api path — Socket.io
 * attaches to the same HTTP server Express runs on, not under the REST prefix.
 */
const socketOrigin = () => API_URL.replace(/\/api\/?$/, "");

/**
 * Owns the single Socket.io connection for the whole app.
 *
 * Mounted once in the root layout, so navigating between pages reuses one
 * connection instead of opening a new one per route. The socket exists only
 * while someone is signed in: it is created on sign-in and torn down on sign
 * out, because the handshake carries the JWT.
 */
export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;

    // Signed out: close any existing connection and stay closed. The state
    // reset is deferred to a microtask so nothing is written synchronously
    // while the effect runs — the same pattern AuthProvider uses.
    if (!user) {
      socketRef.current?.close();
      socketRef.current = null;
      Promise.resolve().then(() => {
        setSocket(null);
        setStatus("idle");
        setOnlineUsers(new Set());
      });
      return;
    }

    // Already connected for this session — do not open a second socket.
    if (socketRef.current) return;

    const token = getToken();
    if (!token) return;

    Promise.resolve().then(() => setStatus("connecting"));
    const next = io(socketOrigin(), {
      auth: { token },
      transports: ["websocket", "polling"],
      // Socket.io retries on its own; these bounds stop it hammering a server
      // that is down while still recovering from a brief blip.
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    next.on("connect", () => {
      setStatus("connected");
      setError(null);
    });
    next.on("disconnect", () => setStatus("connecting"));
    next.on("connect_error", (err) => {
      setStatus("error");
      setError(err.message);
    });

    next.on("presence:snapshot", ({ online }: { online: string[] }) =>
      setOnlineUsers(new Set(online)),
    );
    next.on("user:online", ({ userId }: { userId: string }) =>
      setOnlineUsers((current) => new Set(current).add(userId)),
    );
    next.on("user:offline", ({ userId }: { userId: string }) =>
      setOnlineUsers((current) => {
        const nextSet = new Set(current);
        nextSet.delete(userId);
        return nextSet;
      }),
    );

    socketRef.current = next;
    Promise.resolve().then(() => setSocket(next));

    return () => {
      next.close();
      socketRef.current = null;
    };
  }, [user, loading]);

  const isOnline = useCallback(
    (userId?: string) => Boolean(userId && onlineUsers.has(userId)),
    [onlineUsers],
  );

  const value = useMemo(
    () => ({ socket, status, error, onlineUsers, isOnline }),
    [socket, status, error, onlineUsers, isOnline],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside <SocketProvider>");
  return context;
}
