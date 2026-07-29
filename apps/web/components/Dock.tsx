"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useOs } from "@/lib/store";

const ITEMS = [
  { href: "/hub", label: "Hub" },
  { href: "/learn", label: "Learn" },
  { href: "/market", label: "Market" },
  { href: "/me", label: "You" },
];

/** Bottom dock: thumb reach beats visual density on the primary device. */
export function Dock() {
  const path = usePathname();
  const toggleCompanion = useOs((s) => s.toggleCompanion);

  return (
    <nav
      className="relative z-20 flex items-center justify-around border-t border-edge
                 bg-[rgba(6,8,18,.72)] backdrop-blur-2xl"
      style={{ height: "calc(var(--ec-dock-h) + var(--ec-safe-b))", paddingBottom: "var(--ec-safe-b)" }}
      aria-label="Primary"
    >
      {ITEMS.map((it) => {
        const active = path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-full flex-1 flex-col items-center justify-center gap-1",
              "font-mono text-[8px] uppercase tracking-[.16em]",
              active ? "text-cyan" : "text-dim"
            )}
          >
            {it.label}
          </Link>
        );
      })}
      <button
        onClick={() => toggleCompanion()}
        className="flex h-full flex-1 flex-col items-center justify-center gap-1 font-mono text-[8px] uppercase tracking-[.16em] text-dim"
      >
        Iris
      </button>
    </nav>
  );
}
