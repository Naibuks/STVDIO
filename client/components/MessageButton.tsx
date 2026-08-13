"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { openConversation } from "@/services/conversations";
import { getProfile } from "@/services/users";

/**
 * Starts (or reopens) a conversation with someone from their profile.
 *
 * The server returns the existing thread when there is one, so clicking twice
 * never creates a duplicate. Hidden on your own profile — the server rejects
 * a self-conversation with 400 and offering the button would be a dead end.
 */
export default function MessageButton({ username }: { username: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.username === username) return null;

  const start = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // The profile page knows the username; the API keys on user id, so it is
      // resolved through the existing service rather than widening the
      // conversation endpoint's contract.
      const { user: profile } = await getProfile(username);
      const { conversation } = await openConversation(profile._id);
      router.push(`/messages/${conversation._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open messages");
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="border border-current/30 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
      >
        {busy ? "Opening…" : "Message"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-500">
          {error}
        </span>
      )}
    </>
  );
}
