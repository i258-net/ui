import { expect, test } from "@playwright/test";

/**
 * Behavioural, not visual — no screenshots here.
 *
 * `ThemeToggle` subscribes to the `storage` event so a theme change in one tab
 * lands in every other open tab (ui#60). The unit tests in
 * `packages/ui/src/lib/theme.test.ts` run under node against a stub window and
 * cannot prove the browser actually delivers that event across documents, which
 * is the whole feature. Two real pages in one context can.
 */

const STORY =
  "/iframe.html?id=primitives-themetoggle--default&viewMode=story";

const STORAGE_KEY = "i258-theme";

test.describe("theme cross-tab sync", () => {
  test("a toggle in one tab reaches a tab that was already open", async ({
    context,
  }) => {
    const a = await context.newPage();
    await a.goto(STORY);
    await a.evaluate(
      ([key]) => window.localStorage.setItem(key, "dark"),
      [STORAGE_KEY] as const,
    );
    await a.reload({ waitUntil: "networkidle" });

    // B must be mounted *before* A toggles. If it loaded afterwards it would
    // read the new value at mount and pass without any cross-tab delivery.
    const b = await context.newPage();
    await b.goto(STORY, { waitUntil: "networkidle" });

    const toggleA = a.getByRole("button", { name: /switch to .* theme/i });
    const toggleB = b.getByRole("button", { name: /switch to .* theme/i });

    await expect(toggleA).toHaveAttribute("aria-pressed", "true");
    await expect(toggleB).toHaveAttribute("aria-pressed", "true");
    await expect(b.locator("html")).toHaveAttribute("data-theme", "dark");

    await toggleA.click();

    await expect(a.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(b.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggleB).toHaveAttribute("aria-pressed", "false");

    // And back, so a one-way listener cannot pass.
    await toggleA.click();
    await expect(b.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggleB).toHaveAttribute("aria-pressed", "true");

    await a.close();
    await b.close();
  });

  test("clearing storage in another tab resets to the default theme", async ({
    context,
  }) => {
    const a = await context.newPage();
    await a.goto(STORY);
    await a.evaluate(
      ([key]) => window.localStorage.setItem(key, "light"),
      [STORAGE_KEY] as const,
    );
    await a.reload({ waitUntil: "networkidle" });

    const b = await context.newPage();
    await b.goto(STORY, { waitUntil: "networkidle" });
    await expect(b.locator("html")).toHaveAttribute("data-theme", "light");

    await a.evaluate(() => window.localStorage.clear());

    // `storage.clear()` fires with a null key — DEFAULT_THEME is dark.
    await expect(b.locator("html")).toHaveAttribute("data-theme", "dark");

    await a.close();
    await b.close();
  });
});
