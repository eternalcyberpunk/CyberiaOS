"use client";

import { useEffect, useState } from "react";
import { useOs } from "@/lib/store";

export function Hud() {
  const { tier, detectCapabilities } = useOs();
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    detectCapabilities();
    const t = setInterval(() => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, [detectCapabilities]);

  return (
    <header
      className="flex items-center gap-2.5 px-4 pb-2.5 font-mono text-[10px] uppercase tracking-[.15em] text-dim"
      style={{ paddingTop: "calc(var(--ec-safe-t) + 10px)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_var(--ec-cyan)]" />
      <span>sys <b className="font-normal text-ink">nominal</b></span>
      <span className="flex-1" />
      <span>tier {tier}</span>
      <span>{time}</span>
    </header>
  );
}
