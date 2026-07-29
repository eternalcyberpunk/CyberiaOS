import * as Y from "yjs";
import { assertNoBinary } from "./policies";

export const ROOT_META = "meta";
export const ROOT_ASSETS = "assets";

/**
 * Every project document has the same two roots regardless of studio.
 * Studios claim additional roots declared in their manifest.
 */
export function createProjectDoc(opts: { title: string; studioId: string }): Y.Doc {
  const doc = new Y.Doc();
  const meta = doc.getMap(ROOT_META);
  doc.transact(() => {
    meta.set("title", opts.title);
    meta.set("studioId", opts.studioId);
    meta.set("schemaVersion", 1);
    meta.set("createdAt", Date.now());
  });
  return doc;
}

/** Reference an asset by content hash. Throws if handed bytes. */
export function linkAsset(doc: Y.Doc, key: string, hash: string) {
  assertNoBinary(hash, `assets.${key}`);
  doc.getMap(ROOT_ASSETS).set(key, hash);
}

/** Coalesced parameter write — one op per gesture, not one per pixel. */
export function makeParamWriter(doc: Y.Doc, root: string, coalesceMs = 250) {
  const pending = new Map<string, unknown>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (key: string, value: number | string | boolean) => {
    pending.set(key, value);
    if (timer) return;
    timer = setTimeout(() => {
      const map = doc.getMap(root);
      doc.transact(() => {
        for (const [k, v] of pending) map.set(k, v);
      }, "local-param");
      pending.clear();
      timer = null;
    }, coalesceMs);
  };
}
