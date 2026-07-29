import { Dock } from "@/components/Dock";
import { CommandPalette } from "@/components/CommandPalette";
import { Hud } from "@/components/Hud";

/**
 * The OS shell. Everything inside is a view; the shell owns chrome, the frame
 * governor and the palette. Studios are loaded per route as dynamic chunks,
 * so this layout's bundle stays flat as the studio count grows.
 */
export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col">
      <Hud />
      <main className="relative flex-1 overflow-hidden">{children}</main>
      <Dock />
      <CommandPalette />
    </div>
  );
}
