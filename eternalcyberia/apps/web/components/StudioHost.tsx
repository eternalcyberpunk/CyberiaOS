"use client";

import { useEffect, useRef } from "react";
import { loadStudio, type StudioHandle } from "@ec/studio-sdk";
import { useProjectDoc } from "@/lib/use-project-doc";
import { frameLoop } from "@/lib/frame-loop";
import { makeStudioContext } from "@/lib/studio-context";

/**
 * Mount → subscribe to the single frame loop → dispose. A studio that leaks a
 * GPU context or a media stream shows up here, not three screens later.
 */
export function StudioHost({ studioId }: { studioId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { doc, awareness, ready } = useProjectDoc();

  useEffect(() => {
    if (!ready || !hostRef.current) return;
    let handle: StudioHandle | null = null;
    let unsubscribe = () => {};
    let cancelled = false;

    (async () => {
      const studio = await loadStudio(studioId);
      if (cancelled || !hostRef.current) return;
      handle = studio.mount(makeStudioContext({ doc, awareness, host: hostRef.current }));
      unsubscribe = frameLoop.subscribe(studioId, (dt, now) => handle?.frame?.(dt, now));
      const ro = new ResizeObserver(() => handle?.resize?.());
      ro.observe(hostRef.current);
      unsubscribe = ((prev) => () => { prev(); ro.disconnect(); })(unsubscribe);
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      handle?.dispose();
    };
  }, [studioId, ready, doc, awareness]);

  return <div ref={hostRef} className="px-4 py-3" />;
}
