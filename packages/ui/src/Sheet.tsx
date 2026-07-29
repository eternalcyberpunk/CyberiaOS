import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/** Bottom sheet. The default modal on phones — dialogs are a desktop shape. */
export function Sheet({
  open, onOpenChange, title, children,
}: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-sheet
                     border-t border-[var(--ec-violet)]/30 bg-[rgba(7,9,20,.96)] backdrop-blur-2xl
                     pb-[calc(16px+var(--ec-safe-b))] transition-transform duration-[var(--ec-t-sheet)] ease-ec"
        >
          <Dialog.Title className="px-5 pt-4 pb-3 font-display text-[15px] font-semibold">{title}</Dialog.Title>
          <div className="px-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
