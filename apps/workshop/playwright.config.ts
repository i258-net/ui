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
      // 1280×1980 Button docs page is 50,688. Five baselines had drifted
      // under that budget without ever failing (dotbuzz#445): four still stale
      // on this branch, plus app-shell-with-subtitle-light, a Darwin render 753
      // px from what CI draws, which ui#63 happened to correct. And a full
      // moon→sun swap on the app bar toggle moves only 63 px, so the AppShell
      // stories could not see the bug ui#63 fixed.
      //
      // 0 is not a strict tolerance chosen over a loose one; it is the
      // measured floor. Linux rendering here is deterministic: two renders in
      // one CI job are byte-identical, and at maxDiffPixels: 0, 29 of 30
      // stories matched their baseline exactly. The 30th was a real CSS change
      // — the ~1 viewBox unit crescent shift ui#63 introduced when it collapsed
      // the @supports fallback, 3 px on the AppShell strip — and it has been
      // re-shot. There is nothing sitting in a noise band because there is no
      // noise band; the "~0.02–0.03 same-OS AA fringe" the old comment cited is
      // a cross-platform number.
      //
      // A small nonzero budget was considered and rejected (dotbuzz#445). It
      // does not buy protection from a runner font or Chromium bump: that drift
      // scores in the thousands — 2,306 and 1,814 on the Button docs pages, 753
      // on the Darwin AppShell strip — so it reds the suite at 20 exactly as it
      // does at 0. All a 1–20 band buys is silence about real sub-pixel CSS
      // changes, and it is loosest relative to the mark on the smallest
      // stories: Primitives/ThemeToggle/Default is 1,024 px in total, so 20
      // post-filter pixels is a large slice of the icon it exists to watch, and
      // a Darwin baseline for a story that small could land under it. So any
      // diff fails, and baselines are re-shot deliberately from the CI Linux
      // actuals, never regenerated on a Mac.
      maxDiffPixels: 0,
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
