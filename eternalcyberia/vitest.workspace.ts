import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/*/vitest.config.ts",
  { test: { name: "packages", include: ["packages/**/*.test.ts"], environment: "node" } },
  { test: { name: "api", include: ["apps/api/**/*.test.ts"], environment: "node" } },
]);
