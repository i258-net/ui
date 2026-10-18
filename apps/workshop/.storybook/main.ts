import type { StorybookConfig } from "@storybook/react-vite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Every bare import of a kit dependency in its source (non-test files), e.g.
 * `@base-ui/react/checkbox`. The alias below serves the kit from source, so
 * Vite only meets these deps when a story imports a component that uses
 * them. With a warm optimizer cache from an older kit, a newly imported
 * entry point is discovered mid-run: Vite re-optimizes, reloads the
 * browser, and every story file in flight fails with "Failed to fetch
 * dynamically imported module" (I25-117; the next run passes because the
 * cache now has it). Listing them in `optimizeDeps.include` pre-bundles
 * them up front and puts them in Vite's config hash, so a new entry point
 * invalidates the cache and is optimized before any test runs.
 */
function kitBareImports(): string[] {
  const kit = join(monorepoRoot, "packages/ui");
  const owned = Object.keys(
    JSON.parse(readFileSync(join(kit, "package.json"), "utf8")).dependencies ?? {},
  );
  const src = join(kit, "src");
  const found = new Set<string>();
  for (const file of readdirSync(src, { recursive: true, encoding: "utf8" })) {
    if (!/\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
    const text = readFileSync(join(src, file), "utf8");
    for (const m of text.matchAll(/\bfrom\s+["']([^."'][^"']*)["']/g)) {
      const dep = m[1]!;
      // Kit dependencies only; peers (react) resolve from the consumer.
      if (owned.some((name) => dep === name || dep.startsWith(`${name}/`))) {
        found.add(dep);
      }
    }
  }
  // `@i258/ui > dep`: resolve each from the kit, which owns it under pnpm's
  // strict layout (a bare `@base-ui/react/x` doesn't resolve from here).
  return [...found].sort().map((dep) => `@i258/ui > ${dep}`);
}

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook"
  ],
  docs: {
    defaultName: "Documentation",
  },
  features: {
    // Emit the components manifest so the built Storybook (and the
    // Chromatic-published copy) serves the MCP endpoint at /mcp.
    componentsManifest: true,
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      optimizeDeps: { include: kitBareImports() },
      resolve: {
        alias: {
          "@i258/ui/styles.css": join(
            monorepoRoot,
            "packages/ui/src/styles/entry.css",
          ),
          "@i258/ui": join(monorepoRoot, "packages/ui/src/index.ts"),
        },
      },
    });
  },
};

export default config;
