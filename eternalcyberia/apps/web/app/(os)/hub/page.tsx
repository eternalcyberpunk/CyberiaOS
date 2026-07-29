import Link from "next/link";
import { STUDIOS } from "@/lib/studios";

export default function HubPage() {
  return (
    <div className="h-full overflow-y-auto px-4 pb-[calc(var(--ec-dock-h)+var(--ec-safe-b)+24px)]">
      <header className="flex items-baseline gap-3 pt-4">
        <h1 className="font-display text-[19px] font-semibold">The Hub</h1>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(124,77,255,.22),transparent)]" />
        <span className="font-mono text-[10px] text-dim">{STUDIOS.length} live</span>
      </header>
      <p className="mt-2 max-w-[44ch] text-[13.5px] font-light text-dim">
        Every tile is the studio itself, already running. Tap one to take it full screen.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {STUDIOS.map((s) => (
          <li key={s.id}>
            <Link
              href={`/studio/${s.id}`}
              className="relative block aspect-[1/1.06] overflow-hidden rounded-panel border border-edge
                         bg-glass p-3 transition-transform duration-[var(--ec-t-micro)] ease-ec active:scale-[.965]"
            >
              <span className="font-mono text-[8px] uppercase tracking-[.2em] text-cyan">{s.kind}</span>
              <span className="absolute inset-x-3 bottom-3">
                <span className="block font-display text-[14.5px] font-semibold">{s.name}</span>
                <span className="block font-mono text-[8.5px] uppercase tracking-[.16em] text-dim">
                  tier {s.tier} · {s.budgetKb}kb
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
