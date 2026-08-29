import { useEffect, useState, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";
import "@i258/ui/styles.css";
import { allModes } from "./modes";

/**
 * Gate Chromatic / Playwright VRT on the self-hosted face so snapshots
 * never capture system fallback metrics.
 */
function FontReady({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([
          document.fonts.load('1em "Geist Sans"'),
          document.fonts.load('1em "Geist Mono"'),
        ]);
        await document.fonts.ready;
      } catch {
        // Fall through — better a fallback snapshot than a hung story.
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) return null;
  return children;
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Fail story tests / CI on axe violations (was "todo" — panel-only).
    a11y: { test: "error" },
    layout: "centered",
    // Chromatic pilot: light + dark per story (scoped in workflow via onlyStoryNames).
    chromatic: {
      modes: {
        light: allModes.light,
        dark: allModes.dark,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "light";
      return (
        <FontReady>
          <div
            data-theme={theme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              background: "var(--i258-background)",
              color: "var(--i258-foreground)",
              fontFamily: "var(--i258-font-sans)",
              minWidth: 320,
              minHeight: 120,
              borderRadius: 8,
            }}
          >
            <Story />
          </div>
        </FontReady>
      );
    },
  ],
};

export default preview;
