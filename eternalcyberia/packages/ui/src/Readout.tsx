/** Monospace status line. Data only — never prose. */
export function Readout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none font-mono text-[9px] tracking-[.12em] text-cyan [text-shadow:0_0_10px_rgba(34,224,255,.6)]">
      {children}
    </div>
  );
}
