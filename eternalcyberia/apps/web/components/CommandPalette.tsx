"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOs } from "@/lib/store";
import { STUDIOS } from "@/lib/studios";

/** ⌘K everywhere. The palette is the keyboard surface for the whole OS. */
export function CommandPalette() {
  const { paletteOpen, togglePalette } = useOs();
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      } else if (e.key === "Escape") togglePalette(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [togglePalette]);

  const hits = useMemo(() => {
    const items = [
      ...STUDIOS.map((s) => ({ label: s.name, sub: s.kind, go: `/studio/${s.id}` })),
      { label: "The Hub", sub: "navigate", go: "/hub" },
      { label: "Marketplace", sub: "navigate", go: "/market" },
    ];
    const needle = q.trim().toLowerCase();
    return needle ? items.filter((i) => (i.label + i.sub).toLowerCase().includes(needle)) : items;
  }, [q]);

  if (!paletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 backdrop-blur"
      style={{ paddingTop: "calc(var(--ec-safe-t) + 60px)" }}
      onClick={(e) => e.target === e.currentTarget && togglePalette(false)}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-panel border border-[var(--ec-violet)]/30 bg-[rgba(9,12,26,.96)]">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search studios, tools, commands…"
          className="w-full bg-transparent px-4 py-4 font-mono text-[13px] outline-none placeholder:text-dim"
        />
        <ul className="max-h-[46vh] overflow-y-auto border-t border-edge">
          {hits.map((h) => (
            <li key={h.go}>
              <button
                onClick={() => { togglePalette(false); router.push(h.go); }}
                className="w-full px-4 py-3 text-left hover:bg-[rgba(124,77,255,.14)]"
              >
                <span className="block text-[13px]">{h.label}</span>
                <span className="block font-mono text-[8.5px] uppercase tracking-[.14em] text-dim">{h.sub}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 && (
            <li className="px-4 py-6 text-[13px] text-dim">
              Nothing matches that yet. Try “image”, “code”, or “market”.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
