import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

export type RenderTier = 1 | 2 | 3; // 1 canvas2d · 2 webgl2 · 3 webgpu
export type Capability = "gpu" | "camera" | "mic" | "network" | "fs" | "midi";
export type StudioKind = "image" | "video" | "audio" | "code" | "3d" | "world" | "lab";

export interface StudioManifest {
  id: string;
  name: string;
  kind: StudioKind;
  /** Minimum render tier. The shell will not offer the studio below this. */
  tier: RenderTier;
  /** Enforced by scripts/check-budgets.mjs in CI and asserted at load time. */
  budgetKb: number;
  /** Declared up front; the runtime refuses anything not listed. */
  capabilities: Capability[];
  /** Y.Doc root keys this studio owns. Two studios may not claim the same key. */
  roots: string[];
}

export interface AssetApi {
  /** Content-addressed put. Returns the blake3 hash used as the document reference. */
  put(blob: Blob, kind: string): Promise<{ hash: string; url: string }>;
  get(hash: string): Promise<Blob>;
  url(hash: string): string;
}

export interface ComputeApi {
  /** Always quote before submit. The UI shows cost before anything runs. */
  quote(job: JobSpec): Promise<{ estUsd: number; etaSec: number }>;
  submit(job: JobSpec): Promise<{ jobId: string }>;
  onProgress(jobId: string, cb: (pct: number) => void): () => void;
}

export interface JobSpec {
  type: "render" | "transcode" | "infer" | "embed";
  payload: Record<string, unknown>;
  gpu?: boolean;
}

export interface AiApi {
  /**
   * Agents never mutate the document. They submit a proposal that a human
   * accepts or rejects; acceptance is what applies the Yjs update.
   */
  propose(intent: string, patch: Uint8Array): Promise<{ actionId: string }>;
  ask(prompt: string): AsyncIterable<string>;
  budgetRemainingUsd(): number;
}

export interface StudioContext {
  doc: Y.Doc;
  awareness: Awareness;
  assets: AssetApi;
  compute: ComputeApi;
  ai: AiApi;
  tier: RenderTier;
  reducedMotion: boolean;
  /** Container the studio may render into. Owned by the shell, not the studio. */
  host: HTMLElement;
}

export interface StudioHandle {
  /** Called by the shell's single rAF governor. Never start your own loop. */
  frame?(dt: number, now: number): void;
  resize?(): void;
  /** Must release GPU contexts, workers, media streams and listeners. */
  dispose(): void;
}

export interface StudioModule {
  manifest: StudioManifest;
  mount(ctx: StudioContext): StudioHandle;
}
