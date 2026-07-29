import { registerStudio, registry } from "@ec/studio-sdk";

/**
 * Studios register a loader, never a module. Adding a studio adds one entry
 * here and zero kilobytes to the shell until someone opens it.
 */
registerStudio(
  {
    id: "image", name: "Image Lab", kind: "image", tier: 1,
    budgetKb: 90, capabilities: ["fs"], roots: ["image.params", "image.layers"],
  },
  () => import("@ec/studio-image")
);

registerStudio(
  {
    id: "tar", name: "Tar Unzip", kind: "lab", tier: 1,
    budgetKb: 90, capabilities: ["fs"], roots: ["tar.entries"],
  },
  () => import("@ec/studio-tar")
);

// M3 adds: code, audio, video, 3d — same shape, separate chunks.

export const STUDIOS = registry.list(3);
