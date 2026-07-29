import { notFound } from "next/navigation";
import { STUDIOS } from "@/lib/studios";
import { StudioHost } from "@/components/StudioHost";

export default function StudioPage({ params }: { params: { id: string } }) {
  const manifest = STUDIOS.find((s) => s.id === params.id);
  if (!manifest) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-edge
                         bg-[rgba(5,6,12,.92)] px-4 py-2.5 backdrop-blur-xl">
        <div>
          <h1 className="font-display text-[15px] font-semibold">{manifest.name}</h1>
          <p className="font-mono text-[8.5px] uppercase tracking-[.18em] text-dim">{manifest.kind}</p>
        </div>
      </header>
      {/* The host owns mounting, the frame governor subscription and disposal. */}
      <StudioHost studioId={manifest.id} />
    </div>
  );
}
