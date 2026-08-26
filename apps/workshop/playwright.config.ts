import { defineConfig, devices } from "@playwright/test";

/**
 * Visual baselines for core primitives (light + dark).
 * Serve the static Storybook build — CI will add the job separately (CODEOWNERS).
 */
export default defineConfig({
  testDir: "./vrt",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      // Cross-OS AA (darwin baselines vs ubuntu CI). Tighten once linux
      // baselines are regenerated in CI and committed.
      maxDiffPixelRatio: 0.08,
      animations: "disabled",
    },
  },
  // Same filenames locally and in CI (no -darwin/-linux suffix).
  snapshotPathTemplate:
    "{testDir}/{testFileName}-snapshots/{arg}{ext}",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:6006",
    trace: "on-first-retry",
  },
  webServer: {
    // `serve` 301s /iframe.html?... → /iframe and drops the query string.
    command:
      "python3 -m http.server 6006 --bind 127.0.0.1 --directory storybook-static",
    url: "http://127.0.0.1:6006/iframe.html",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
