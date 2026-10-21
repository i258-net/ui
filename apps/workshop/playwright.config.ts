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
      // maxDiffPixels counts only pixels pixelmatch calls different, and by
      // default that means a YIQ distance above threshold 0.2 — about 52
      // levels on a grey ramp. The zinc/indigo palette (I25-106) repainted
      // all 5,304 pixels of Primitives/Badge/Status and both themes passed
      // against the stale Tokyo baselines, so CI uploaded no actual to
      // re-shoot from (I25-120): no pixel of that repaint scores above 0.15.
      //
      // 0.005 sits between two measured distributions (I25-120). Below it is
      // 8-bit rounding: a step of one level on each channel scores at most
      // 0.0039. Playwright 1.64.1's Chromium draws eight overlay and Docs
      // snapshots shot under 1.63 up to 23,508 px differently, every pixel
      // by exactly one level — box-shadow halos, text under the dialog
      // scrim — so they fail at 0 and pass here. Above it are palette
      // changes, and the faintest sets the ceiling: a 10° oklch hue turn of
      // the success and danger badge washes peaks at 0.0073 in Day (1,493 px
      // fail here, none at 0.01) and 0.034 in Night. Tokyo→zinc peaks at
      // 0.15. Six token nudges — tint-mix 8→12% / 16→22%, surface, hairline
      // border, muted, accent, success-text — repaint 84 snapshots and 80
      // fail here; the 4 that pass are Day accent snapshots that moved a
      // single level, which no threshold can tell from rounding. Looser
      // loses coverage fast: 76 fail at 0.01, 56 at 0.02 (none of the
      // surface nudge's 18), 2 at 0.05. The margin is one level on purpose:
      // a Chromium that moves pixels by two fails, and is re-shot from CI
      // actuals like any other drift.
      //
      // pixelmatch still skips pixels it judges anti-aliased (Playwright
      // gives no includeAA option): a muted-text change that moves 2,920
      // pixels of the inspector frame reports 1,655. A change confined to
      // glyph edges can still pass.
      threshold: 0.005,
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
