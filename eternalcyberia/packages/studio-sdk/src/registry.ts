import type { StudioModule, RenderTier } from "./types";

type Loader = () => Promise<{ default: StudioModule }>;

const loaders = new Map<string, Loader>();
const manifests = new Map<string, StudioModule["manifest"]>();

/**
 * Studios register a *loader*, not a module. Nothing is downloaded until the
 * user opens the studio, which is what keeps the shell bundle flat as we add tools.
 */
export function registerStudio(manifest: StudioModule["manifest"], load: Loader) {
  if (manifests.has(manifest.id)) throw new Error(`duplicate studio id: ${manifest.id}`);
  for (const other of manifests.values()) {
    const clash = other.roots.find((r) => manifest.roots.includes(r));
    if (clash) throw new Error(`root key "${clash}" already claimed by ${other.id}`);
  }
  manifests.set(manifest.id, manifest);
  loaders.set(manifest.id, load);
}

export const registry = {
  list: (tier: RenderTier) => [...manifests.values()].filter((m) => m.tier <= tier),
  get: (id: string) => manifests.get(id),
};

export async function loadStudio(id: string): Promise<StudioModule> {
  const load = loaders.get(id);
  if (!load) throw new Error(`unknown studio: ${id}`);
  const mod = (await load()).default;
  if (mod.manifest.id !== id) throw new Error(`manifest id mismatch for ${id}`);
  return mod;
}
