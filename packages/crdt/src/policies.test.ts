import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createProjectDoc, linkAsset, makeParamWriter } from "./project";

describe("project document", () => {
  it("refuses binary in the document", () => {
    const doc = createProjectDoc({ title: "t", studioId: "image" });
    // @ts-expect-error deliberate misuse
    expect(() => linkAsset(doc, "plate", new Uint8Array([1, 2, 3]))).toThrow(/binary value/);
  });

  it("converges regardless of op order", () => {
    const a = createProjectDoc({ title: "t", studioId: "image" });
    const b = new Y.Doc();
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a));

    a.getMap("params").set("threshold", 0.4);
    b.getMap("params").set("threshold", 0.9);
    b.getMap("params").set("angle", 12);

    const ua = Y.encodeStateAsUpdate(a);
    const ub = Y.encodeStateAsUpdate(b);
    Y.applyUpdate(a, ub);
    Y.applyUpdate(b, ua);

    expect(a.getMap("params").toJSON()).toEqual(b.getMap("params").toJSON());
  });

  it("coalesces a slider drag into one transaction", async () => {
    const doc = createProjectDoc({ title: "t", studioId: "image" });
    let transactions = 0;
    doc.on("afterTransaction", () => transactions++);
    const write = makeParamWriter(doc, "params", 10);
    for (let i = 0; i < 40; i++) write("threshold", i / 40);
    await new Promise((r) => setTimeout(r, 40));
    expect(transactions).toBe(1);
  });
});
