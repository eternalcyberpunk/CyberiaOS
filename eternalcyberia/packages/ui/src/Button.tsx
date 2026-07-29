import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Renders full-width; the default on phones where thumb reach beats density. */
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-control " +
  "font-display text-[12px] font-semibold uppercase tracking-[.1em] " +
  "transition-transform duration-[var(--ec-t-micro)] ease-ec active:scale-[.97] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan focus-visible:outline-offset-2 " +
  "disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "border border-[var(--ec-violet)]/50 bg-[linear-gradient(100deg,rgba(124,77,255,.22),rgba(34,224,255,.08))] text-ink",
  ghost: "border border-edge text-dim hover:text-ink",
  danger: "border border-[#ff5c3d]/60 text-[#ff5c3d]",
};

export function Button({ variant = "solid", block, className, ...rest }: ButtonProps) {
  return <button className={clsx(base, variants[variant], block && "w-full", className)} {...rest} />;
}
