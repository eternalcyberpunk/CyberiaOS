import { describe, expect, it } from "vitest";
import { detectFormat, parseTar } from "./tar";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal ustar tar archive containing a single file entry.
 * The checksum field is left as zeros — our parser does not validate it.
 */
function makeTar(filename: string, content: Uint8Array): Uint8Array {
  const sizeOctal = content.length.toString(8).padStart(11, "0") + "\0";

  const header = new Uint8Array(512);

  // name (offset 0, 100 bytes)
  for (let i = 0; i < Math.min(filename.length, 100); i++) {
    header[i] = filename.charCodeAt(i);
  }

  // mode (offset 100, 8 bytes)
  const mode = "0000644\0";
  for (let i = 0; i < mode.length; i++) header[100 + i] = mode.charCodeAt(i);

  // size (offset 124, 12 bytes)
  for (let i = 0; i < sizeOctal.length; i++) header[124 + i] = sizeOctal.charCodeAt(i);

  // mtime (offset 136, 12 bytes) — zero
  header[136] = "0".charCodeAt(0);

  // type flag (offset 156) — regular file
  header[156] = "0".charCodeAt(0);

  // ustar magic (offset 257)
  const magic = "ustar\0";
  for (let i = 0; i < magic.length; i++) header[257 + i] = magic.charCodeAt(i);

  // ustar version (offset 263)
  header[263] = "0".charCodeAt(0);
  header[264] = "0".charCodeAt(0);

  // Pad file data to a 512-byte boundary
  const dataBlocks = Math.ceil(content.length / 512) * 512;
  const data = new Uint8Array(dataBlocks);
  data.set(content);

  // archive = header + data blocks + two zero end-of-archive blocks
  const archive = new Uint8Array(512 + dataBlocks + 1024);
  archive.set(header, 0);
  archive.set(data, 512);
  return archive;
}

// ─── detectFormat ─────────────────────────────────────────────────────────────

describe("detectFormat", () => {
  it("detects gzip by magic bytes 1f 8b", () => {
    expect(detectFormat(new Uint8Array([0x1f, 0x8b, 0x08, 0x00]))).toBe("tar.gz");
  });

  it("detects bzip2 by magic bytes 42 5a 68", () => {
    expect(detectFormat(new Uint8Array([0x42, 0x5a, 0x68, 0x39]))).toBe("tar.bz2");
  });

  it("detects ustar tar by magic at offset 257", () => {
    const bytes = new Uint8Array(263);
    bytes[257] = 0x75; // u
    bytes[258] = 0x73; // s
    bytes[259] = 0x74; // t
    bytes[260] = 0x61; // a
    bytes[261] = 0x72; // r
    expect(detectFormat(bytes)).toBe("tar");
  });

  it("falls back to tar for ≥512 bytes without known magic", () => {
    expect(detectFormat(new Uint8Array(512))).toBe("tar");
  });

  it("returns unknown for short unrecognised data", () => {
    expect(detectFormat(new Uint8Array([0x00, 0x01, 0x02]))).toBe("unknown");
  });

  it("gzip takes priority over tar fallback", () => {
    const bytes = new Uint8Array(512);
    bytes[0] = 0x1f;
    bytes[1] = 0x8b;
    expect(detectFormat(bytes)).toBe("tar.gz");
  });
});

// ─── parseTar ─────────────────────────────────────────────────────────────────

describe("parseTar", () => {
  it("returns empty array for an all-zero (end-of-archive) buffer", () => {
    expect(parseTar(new Uint8Array(1024))).toHaveLength(0);
  });

  it("parses a single text file entry", () => {
    const content = new TextEncoder().encode("hello, world");
    const tar = makeTar("hello.txt", content);
    const entries = parseTar(tar);

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("hello.txt");
    expect(entries[0].type).toBe("file");
    expect(entries[0].size).toBe(12);
    expect(new TextDecoder().decode(entries[0].data)).toBe("hello, world");
  });

  it("preserves exact binary data across a 512-byte block boundary", () => {
    const content = new Uint8Array(600).fill(0xde);
    const tar = makeTar("big.bin", content);
    const entries = parseTar(tar);

    expect(entries[0].size).toBe(600);
    expect(entries[0].data).toEqual(content);
  });

  it("returns data length equal to declared size (not padded size)", () => {
    const content = new Uint8Array(300).fill(0xab);
    const tar = makeTar("data.bin", content);
    expect(parseTar(tar)[0].data.length).toBe(300);
  });

  it("handles a zero-length file", () => {
    const tar = makeTar("empty.txt", new Uint8Array(0));
    const entries = parseTar(tar);
    expect(entries[0].size).toBe(0);
    expect(entries[0].data.length).toBe(0);
  });

  it("parses multiple consecutive entries", () => {
    const a = new TextEncoder().encode("file-a");
    const b = new TextEncoder().encode("file-b-content");
    // Concatenate two tars minus the trailing end-of-archive blocks of the first
    const tarA = makeTar("a.txt", a);
    const tarB = makeTar("b.txt", b);
    // Combine: header+data of A, then header+data of B, then two EOA blocks
    const aBlocks = 512 + Math.ceil(a.length / 512) * 512;
    const bBlocks = 512 + Math.ceil(b.length / 512) * 512;
    const combined = new Uint8Array(aBlocks + bBlocks + 1024);
    combined.set(tarA.subarray(0, aBlocks), 0);
    combined.set(tarB.subarray(0, bBlocks), aBlocks);
    // last 1024 bytes are zero (end-of-archive)

    const entries = parseTar(combined);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("a.txt");
    expect(entries[1].name).toBe("b.txt");
    expect(new TextDecoder().decode(entries[1].data)).toBe("file-b-content");
  });

  it("stops at the first double-zero block, ignoring trailing garbage", () => {
    const content = new TextEncoder().encode("x");
    const tar = makeTar("x.txt", content);
    // Append extra non-zero garbage after the end-of-archive marker
    const withGarbage = new Uint8Array(tar.length + 512);
    withGarbage.set(tar);
    withGarbage.fill(0xff, tar.length);
    expect(parseTar(withGarbage)).toHaveLength(1);
  });
});
