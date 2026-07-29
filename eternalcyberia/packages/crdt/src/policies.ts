/**
 * Merge policy per node type. These are the rules the whole platform depends on;
 * they are covered by property-based tests that apply random op orders and assert
 * convergence, and that a delete never resurrects.
 */
export type MergePolicy =
  | "text"        // Y.Text — character CRDT, genuinely conflict-free
  | "lww"         // Y.Map key — last writer wins, client-coalesced at 250ms
  | "ordered"     // Y.Array of ids — position is lww, membership is a set union
  | "set"         // add/remove set; remove wins
  | "ref";        // content hash pointing at object storage — never inline bytes

export const COALESCE_MS = 250;

/** Binary never enters the document. This is enforced, not advisory. */
export function assertNoBinary(value: unknown, path: string): void {
  if (value instanceof Uint8Array || value instanceof ArrayBuffer || value instanceof Blob) {
    throw new Error(
      `binary value at "${path}" — store it with assets.put() and reference the hash`
    );
  }
}

export const POLICY: Record<string, MergePolicy> = {
  "code.source": "text",
  "notes.body": "text",
  "params.*": "lww",
  "timeline.clips": "ordered",
  "layers.order": "ordered",
  "layers.byId": "set",
  "assets.*": "ref",
};
