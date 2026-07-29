import type { StudioModule, StudioContext, StudioHandle } from "@ec/studio-sdk";
import { makeParamWriter } from "@ec/crdt";
import { sortPixels } from "./sort";

/**
 * Reference studio. Deliberately small: it exists to prove the contract holds —
 * shared params over CRDT, one frame loop owned by the shell, assets by reference,
 * clean disposal. Port of the pixel sorter from the design spike.
 */
const studio: StudioModule = {
  manifest: {
    id: "image",
    name: "Image Lab",
    kind: "image",
    tier: 1,
    budgetKb: 90,
    capabilities: ["fs"],
    roots: ["image.params", "image.layers"],
  },

  mount(ctx: StudioContext): StudioHandle {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;touch-action:none";
    ctx.host.appendChild(canvas);
    const g = canvas.getContext("2d")!;

    const params = ctx.doc.getMap("image.params");
    const write = makeParamWriter(ctx.doc, "image.params");
    if (!params.has("threshold")) write("threshold", 0.55);

    // Held on an object so the union type survives; a plain `let` that is only
    // ever assigned null gets narrowed away and dispose() stops typechecking.
    const state: { source: ImageBitmap | null } = { source: null };
    let dirty = true;

    // Any peer changing a parameter marks us dirty — this is all multiplayer takes.
    const onChange = () => { dirty = true; };
    params.observe(onChange);

    // Awareness is ephemeral: cursor and tool, never persisted.
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ctx.awareness.setLocalStateField("cursor", {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
        tool: "sort",
      });
    };
    canvas.addEventListener("pointermove", onPointer);

    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientWidth * 0.72 * dpr);
      canvas.style.height = `${canvas.clientWidth * 0.72}px`;
      dirty = true;
    };
    fit();

    return {
      frame() {
        if (!dirty) return;          // the shell calls us every frame; we opt out
        dirty = false;
        const threshold = (params.get("threshold") as number) ?? 0.55;
        if (state.source) g.drawImage(state.source, 0, 0, canvas.width, canvas.height);
        else {
          const grad = g.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, "#120a2e");
          grad.addColorStop(1, "#22e0ff");
          g.fillStyle = grad;
          g.fillRect(0, 0, canvas.width, canvas.height);
        }
        const img = g.getImageData(0, 0, canvas.width, canvas.height);
        sortPixels(img, threshold);
        g.putImageData(img, 0, 0);
      },
      resize: fit,
      dispose() {
        params.unobserve(onChange);
        canvas.removeEventListener("pointermove", onPointer);
        state.source?.close();
        canvas.remove();
      },
    };
  },
};

export default studio;
