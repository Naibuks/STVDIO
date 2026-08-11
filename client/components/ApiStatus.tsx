"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/services/api";
import type { HealthResponse } from "@/types/api";

type State =
  | { kind: "loading" }
  | { kind: "ready"; health: HealthResponse }
  | { kind: "error"; message: string };

/**
 * Foundation-phase diagnostic: confirms the client can reach the Express API.
 * Replaced by real UI once feature work begins.
 */
export default function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    getHealth()
      .then((health) => setState({ kind: "ready", health }))
      .catch((error: Error) =>
        setState({ kind: "error", message: error.message }),
      );
  }, []);

  if (state.kind === "loading") {
    return <Row label="API" value="checking…" />;
  }

  if (state.kind === "error") {
    return <Row label="API" value={`unreachable — ${state.message}`} />;
  }

  return (
    <>
      <Row label="API" value={state.health.status} />
      <Row label="Database" value={state.health.database} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-current/15 py-2">
      <span className="text-current/50">{label}</span>
      <span>{value}</span>
    </div>
  );
}
