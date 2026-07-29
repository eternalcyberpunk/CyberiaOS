/**
 * Tailwind preset. Values point at the CSS variables emitted by tokens.css,
 * so this file stays plain CJS and never imports TypeScript — a preset that
 * requires a .ts file breaks any build that loads config without a transpiler.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        void: "var(--ec-void)",
        navy: "var(--ec-navy)",
        glass: "var(--ec-glass)",
        violet: "var(--ec-violet)",
        cyan: "var(--ec-cyan)",
        magenta: "var(--ec-magenta)",
        ink: "var(--ec-ink)",
        dim: "var(--ec-dim)",
        edge: "var(--ec-edge)",
      },
      fontFamily: {
        display: ["var(--ec-font-display)"],
        body: ["var(--ec-font-body)"],
        mono: ["var(--ec-font-mono)"],
      },
      borderRadius: {
        control: "var(--ec-r-control)",
        panel: "var(--ec-r-panel)",
        sheet: "var(--ec-r-sheet)",
      },
      transitionTimingFunction: { ec: "var(--ec-ease)" },
    },
  },
};
