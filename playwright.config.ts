import { defineConfig, devices } from "@playwright/test";

/** Mobile is a first-class project, not an afterthought. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.CI ? undefined : { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true },
});
