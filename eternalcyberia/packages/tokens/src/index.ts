/**
 * Single source of truth for every visual decision.
 * Compiles to CSS variables (tokens.css) and a Tailwind preset so a studio
 * physically cannot invent a colour, a radius, or an easing curve.
 */
export const color = {
  void: "#05060c",
  navy: "#0a1024",
  glass: "rgba(12,18,40,0.55)",
  violet: "#7c4dff",
  cyan: "#22e0ff",
  magenta: "#ff2fd0",
  ink: "#eef2ff",
  dim: "#7d86a8",
  edge: "rgba(238,242,255,0.08)",
} as const;

/** cyan = live/interactive · magenta = structure · violet = atmosphere */
export const semantic = {
  interactive: color.cyan,
  structure: color.magenta,
  ambient: color.violet,
  danger: "#ff5c3d",
  success: "#4dffb0",
} as const;

export const font = {
  display: "'Chakra Petch', system-ui, sans-serif",
  body: "'Sora', system-ui, -apple-system, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const;

/** Fixed steps. Studio chrome never exceeds 19. */
export const size = [9, 10, 12, 13.5, 15, 17, 19, 24, 34, 62] as const;
export const space = [4, 8, 12, 16, 22, 32, 48, 64] as const;
export const radius = { control: 10, panel: 16, sheet: 22, pill: 999 } as const;

/** One curve. Anything over 450ms is a wait and needs a reason. */
export const motion = {
  ease: "cubic-bezier(.22,1,.36,1)",
  micro: 120,
  panel: 320,
  sheet: 450,
} as const;

export const layout = {
  dockHeight: 64,
  minTouchTarget: 44,
  frameBudgetMs: 8,
} as const;

export type Token = typeof color & typeof semantic;
