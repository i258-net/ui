import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  docs: {
    defaultName: "Documentation",
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
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
