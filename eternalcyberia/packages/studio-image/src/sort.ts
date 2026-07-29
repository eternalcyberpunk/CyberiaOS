/** Luminance-keyed pixel sort. Pure and synchronous so it is trivially testable. */
export function sortPixels(img: ImageData, threshold: number, span = 0.45): void {
  const { data: d, width: W, height: H } = img;
  const lum = (i: number) => (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255;

  for (let x = 0; x < W; x++) {
    let start = -1;
    for (let y = 0; y <= H; y++) {
      const i = (y * W + x) * 4;
      const v = y < H ? lum(i) : -1;
      const inRun = y < H && v > threshold && v < threshold + span;

      if (inRun && start < 0) start = y;
      if ((!inRun || y === H) && start >= 0) {
        const seg: Array<[number, number, number, number]> = [];
        for (let q = start; q < y; q++) {
          const j = (q * W + x) * 4;
          seg.push([d[j], d[j + 1], d[j + 2], lum(j)]);
        }
        seg.sort((a, b) => a[3] - b[3]);
        for (let q = start; q < y; q++) {
          const j = (q * W + x) * 4;
          const s = seg[q - start];
          d[j] = s[0]; d[j + 1] = s[1]; d[j + 2] = s[2];
        }
        start = -1;
      }
    }
  }
}
