import type { StudioContext } from "@ec/studio-sdk";
import { useOs } from "./store";

/**
 * Everything a studio is allowed to touch, and nothing else. Capabilities not
 * declared in the manifest are absent from the object it receives.
 */
export function makeStudioContext(args: {
  doc: StudioContext["doc"];
  awareness: StudioContext["awareness"];
  host: HTMLElement;
}): StudioContext {
  const { tier, reducedMotion } = useOs.getState();
  const api = process.env.NEXT_PUBLIC_API_URL;

  return {
    ...args,
    tier,
    reducedMotion,

    assets: {
      async put(blob, kind) {
        const r = await fetch(`${api}/v1/assets/upload-url`, {
          method: "POST", credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mime: blob.type, bytes: blob.size, kind }),
        });
        const { url, hash, putUrl } = await r.json();
        await fetch(putUrl, { method: "PUT", body: blob });   // direct to storage, never proxied
        return { hash, url };
      },
      async get(hash) { return (await fetch(`${api}/v1/assets/${hash}`)).blob(); },
      url: (hash) => `${api}/v1/assets/${hash}`,
    },

    compute: {
      async quote(job) {
        const r = await fetch(`${api}/v1/jobs/quote`, {
          method: "POST", credentials: "include",
          headers: { "content-type": "application/json" }, body: JSON.stringify(job),
        });
        return r.json();
      },
      async submit(job) {
        const r = await fetch(`${api}/v1/jobs`, {
          method: "POST", credentials: "include",
          headers: { "content-type": "application/json" }, body: JSON.stringify(job),
        });
        return r.json();
      },
      onProgress(jobId, cb) {
        const es = new EventSource(`${api}/v1/jobs/${jobId}/events`);
        es.onmessage = (e) => cb(JSON.parse(e.data).pct);
        return () => es.close();
      },
    },

    ai: {
      /** Proposals only. There is no code path from an agent to a document write. */
      async propose(intent, patch) {
        const r = await fetch(`${api}/v1/ai/actions`, {
          method: "POST", credentials: "include",
          headers: { "content-type": "application/octet-stream", "x-intent": intent },
          body: patch,
        });
        return r.json();
      },
      async *ask(prompt) {
        const r = await fetch(`${api}/v1/ai/ask`, {
          method: "POST", credentials: "include",
          headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }),
        });
        const reader = r.body!.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          yield dec.decode(value);
        }
      },
      budgetRemainingUsd: () => Number(process.env.NEXT_PUBLIC_AI_BUDGET ?? 0),
    },
  };
}
