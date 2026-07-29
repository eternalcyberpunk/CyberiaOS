"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createProjectDoc } from "@ec/crdt";

/**
 * One Yjs document per project, shared by every studio the project touches.
 * The capability token is minted by the API and scoped to this room only.
 */
export function useProjectDoc(projectId = "local-draft") {
  const doc = useMemo(() => createProjectDoc({ title: "Untitled", studioId: "image" }), []);
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Offline-first: the document is usable before the socket connects.
      setReady(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/capability`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: `project:${projectId}` }),
      }).catch(() => null);
      if (!res?.ok || cancelled) return;

      const { token } = await res.json();
      const p = new WebsocketProvider(
        process.env.NEXT_PUBLIC_REALTIME_URL!,
        `project:${projectId}`,
        doc,
        { params: { token }, connect: true }
      );
      if (cancelled) { p.destroy(); return; }
      setProvider(p);
    })();

    return () => { cancelled = true; provider?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, doc]);

  return { doc, awareness: provider?.awareness ?? new Y.Doc().getMap("noop") as any, ready };
}
