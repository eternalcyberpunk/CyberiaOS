"use client";

import { create } from "zustand";

/**
 * UI state only. Anything collaborative lives in the Yjs document, and anything
 * durable lives in Postgres — this store is allowed to be lost on refresh.
 */
interface OsState {
  paletteOpen: boolean;
  companionOpen: boolean;
  tier: 1 | 2 | 3;
  reducedMotion: boolean;
  togglePalette: (open?: boolean) => void;
  toggleCompanion: (open?: boolean) => void;
  detectCapabilities: () => void;
}

export const useOs = create<OsState>((set) => ({
  paletteOpen: false,
  companionOpen: false,
  tier: 1,
  reducedMotion: false,

  togglePalette: (open) => set((s) => ({ paletteOpen: open ?? !s.paletteOpen })),
  toggleCompanion: (open) => set((s) => ({ companionOpen: open ?? !s.companionOpen })),

  /** Runs once at boot; the result is cached on the profile, not re-probed. */
  detectCapabilities: () =>
    set(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let tier: 1 | 2 | 3 = 1;
      if ("gpu" in navigator) tier = 3;
      else {
        const c = document.createElement("canvas");
        if (c.getContext("webgl2")) tier = 2;
      }
      return { tier, reducedMotion };
    }),
}));
