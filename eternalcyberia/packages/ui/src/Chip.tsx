import clsx from "clsx";
import type { ReactNode } from "react";

export function Chip({
  on, children, onClick,
}: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={clsx(
        "min-h-[36px] px-3 rounded-full border font-mono text-[10px] uppercase tracking-[.12em] transition-colors",
        on ? "border-cyan text-cyan bg-cyan/10" : "border-edge text-dim"
      )}
    >
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
