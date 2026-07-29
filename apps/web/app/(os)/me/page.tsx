export default function Page() {
  return (
    <div className="h-full overflow-y-auto px-4 pb-[calc(var(--ec-dock-h)+var(--ec-safe-b)+24px)]">
      <header className="flex items-baseline gap-3 pt-4">
        <h1 className="font-display text-[19px] font-semibold">You</h1>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(124,77,255,.22),transparent)]" />
      </header>
      <div className="mt-6 rounded-panel border border-dashed border-[var(--ec-violet)]/30 px-5 py-11 text-center">
        <p className="mx-auto max-w-[34ch] text-[13.5px] font-light text-dim">Your profile, signing key, quota and everything the platform knows about your usage — exportable and deletable.</p>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[.2em] text-cyan">Ships in M1</p>
      </div>
    </div>
  );
}
