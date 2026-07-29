import { describe, expect, it } from "vitest";
import { sortPixels } from "./sort";

const make = (w: number, h: number, fill: (i: number) => [number, number, number]) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = fill(i);
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  return { data: d, width: w, height: h, colorSpace: "srgb" } as ImageData;
};

describe("sortPixels", () => {
  it("is stable when nothing crosses the threshold", () => {
    const img = make(8, 8, () => [0, 0, 0]);
    const before = Uint8ClampedArray.from(img.data);
    sortPixels(img, 0.5);
    expect(img.data).toEqual(before);
  });

  it("orders a run by luminance", () => {
    const img = make(1, 4, (i) => [200 - i * 30, 200 - i * 30, 200 - i * 30]);
    sortPixels(img, 0.1, 1);
    const lum = [0, 1, 2, 3].map((y) => img.data[y * 4]);
    expect(lum).toEqual([...lum].sort((a, b) => a - b));
  });

  it("preserves alpha", () => {
    const img = make(4, 4, (i) => [i * 10, i * 10, i * 10]);
    sortPixels(img, 0.05, 1);
    for (let i = 3; i < img.data.length; i += 4) expect(img.data[i]).toBe(255);
  });
});
