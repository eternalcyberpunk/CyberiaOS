/** Represents one entry extracted from a tar archive. */
export interface TarEntry {
  name: string;
  size: number;
  type: "file" | "dir" | "symlink" | "other";
  data: Uint8Array;
  mtime: number;
  linkname?: string;
}

export type TarFormat = "tar" | "tar.gz" | "tar.bz2" | "unknown";

/**
 * Identify the archive format by inspecting magic bytes.
 * Does not validate the full header — just enough to route decompression.
 */
export function detectFormat(bytes: Uint8Array): TarFormat {
  // gzip: 1f 8b
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return "tar.gz";
  // bzip2: 42 5a 68 ("BZh")
  if (bytes.length >= 3 && bytes[0] === 0x42 && bytes[1] === 0x5a && bytes[2] === 0x68) return "tar.bz2";
  // ustar magic at offset 257 – covers POSIX and GNU tar
  if (
    bytes.length >= 263 &&
    bytes[257] === 0x75 && // u
    bytes[258] === 0x73 && // s
    bytes[259] === 0x74 && // t
    bytes[260] === 0x61 && // a
    bytes[261] === 0x72    // r
  ) return "tar";
  // Might still be a valid old-style tar (V7, no magic)
  if (bytes.length >= 512) return "tar";
  return "unknown";
}

/**
 * Decompress a gzip byte stream using the browser's native DecompressionStream API.
 * Requires a browser or runtime that exposes CompressionStream / DecompressionStream
 * (Chrome 80+, Firefox 113+, Safari 16.4+, Node 18+).
 */
export async function decompressGzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

// ─── internal helpers ──────────────────────────────────────────────────────

function readCStr(buf: Uint8Array, off: number, len: number): string {
  let end = off;
  while (end < off + len && buf[end] !== 0) end++;
  return new TextDecoder("utf-8", { fatal: false }).decode(buf.subarray(off, end));
}

function readOctal(buf: Uint8Array, off: number, len: number): number {
  const s = readCStr(buf, off, len).trim();
  return s ? parseInt(s, 8) : 0;
}

/**
 * Parse raw (already-decompressed) tar bytes into a flat list of entries.
 * Supports POSIX ustar, GNU tar, and old V7 format.
 * PAX/GNU extended headers ('x', 'g', 'L', 'K') are silently skipped.
 */
export function parseTar(bytes: Uint8Array): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;
  let emptyBlocks = 0;

  while (offset + 512 <= bytes.length) {
    const hdr = bytes.subarray(offset, offset + 512);

    // End-of-archive: two consecutive zero-filled 512-byte blocks
    let allZero = true;
    for (let i = 0; i < 512; i++) {
      if (hdr[i] !== 0) { allZero = false; break; }
    }
    if (allZero) {
      if (++emptyBlocks >= 2) break;
      offset += 512;
      continue;
    }
    emptyBlocks = 0;

    const typeFlag = String.fromCharCode(hdr[156]);

    // Skip PAX / GNU metadata entries — their payloads affect the next entry's
    // metadata but we treat them as opaque and only parse the entry data.
    if (typeFlag === "x" || typeFlag === "g" || typeFlag === "L" || typeFlag === "K") {
      const sz = readOctal(hdr, 124, 12);
      offset += 512 + Math.ceil(sz / 512) * 512;
      continue;
    }

    const namePart = readCStr(hdr, 0, 100);
    const prefix = readCStr(hdr, 345, 155);
    const name = prefix ? `${prefix}/${namePart}` : namePart;
    const size = readOctal(hdr, 124, 12);
    const mtime = readOctal(hdr, 136, 12);
    const linkname = readCStr(hdr, 157, 100) || undefined;

    let type: TarEntry["type"] = "other";
    if (typeFlag === "0" || typeFlag === "\0") type = "file";
    else if (typeFlag === "5") type = "dir";
    else if (typeFlag === "2") type = "symlink";

    offset += 512;
    const dataEnd = Math.min(offset + size, bytes.length);
    const data = type === "file" ? bytes.slice(offset, dataEnd) : new Uint8Array(0);

    entries.push({ name, size, type, data, mtime, linkname });
    offset += Math.ceil(size / 512) * 512;
  }

  return entries;
}
