/**
 * Bundle budget gate.
 * Every studio package declares manifest.budgetKb. If its built chunk exceeds it,
 * the build fails here rather than on a user's phone six weeks later.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const STUDIOS = "packages";
let failed = false;

for (const dir of await readdir(STUDIOS)) {
  if (!dir.startsWith("studio-") || dir === "studio-sdk") continue;
  const pkg = JSON.parse(await readFile(join(STUDIOS, dir, "package.json"), "utf8"));
  const budget = pkg.ec?.budgetKb;
  if (!budget) {
    console.error(`✗ ${dir}: no ec.budgetKb declared`);
    failed = true;
    continue;
  }
  let bytes = 0;
  try {
    for (const f of await readdir(join(STUDIOS, dir, "dist"))) {
      if (f.endsWith(".js")) bytes += (await stat(join(STUDIOS, dir, "dist", f))).size;
    }
  } catch {
    console.error(`✗ ${dir}: no dist/ — did the build run?`);
    failed = true;
    continue;
  }
  const kb = Math.round(bytes / 1024);
  const ok = kb <= budget;
  console.log(`${ok ? "✓" : "✗"} ${dir.padEnd(20)} ${String(kb).padStart(4)}kb / ${budget}kb`);
  if (!ok) failed = true;
}

process.exit(failed ? 1 : 0);
