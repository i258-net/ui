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
      // Linux baselines are source of truth (CI).
      //
      // This was maxDiffPixelRatio: 0.02, which is a fraction of each story's
      // own area — so the tolerance was largest exactly where a component is
      // smallest relative to its frame. 0.02 of the 1248×45 AppShell strip is
      // 1,123 px, more than the entire 32×32 ThemeToggle story; 0.02 of the
      // 1280×1980 Button docs page is 50,688. Three baselines had drifted
      // under that budget without ever failing (dotbuzz#445), and a full
      // moon→sun swap on the app bar toggle moves only 63 px, so the AppShell
      // stories could not see the bug ui#63 fixed.
      //
      // 20 px is not an antialiasing allowance. Linux rendering here is
      // deterministic: two renders in one CI job are byte-identical, and 29 of
      // 30 stories match their baseline exactly at maxDiffPixels: 0. So 20 is
      // headroom over a measured floor of zero, and what sits above it is a
      // real CSS change, a baseline shot on the wrong OS, or a runner
      // font/Chromium bump — all three should fail and be re-shot deliberately
      // from the CI Linux actuals, never regenerated on a Mac.
      //
      // What 20 still misses: a sub-pixel geometry change inside a wide story,
      // like the ~1 viewBox unit crescent shift ui#63 introduced, which scores
      // 3 px on the AppShell strip. That is by design — AppShell's job is
      // layout and title step (ui#59). Iconography is watched where the icon
      // is big, on Primitives/ThemeToggle/Default at 32×32.
      maxDiffPixels: 20,
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
