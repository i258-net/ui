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
      // Honor Storybook layout:
      // - centered → flex-center card (intrinsic stories: Button, Badge, …)
      // - padded/fullscreen → full-bleed theme frame (block + width 100% +
      //   min-height 100vh) so max-width grids fill to their max and the
      //   canvas is full height/width. box-sizing:border-box so width:100%
      //   + padding does not overflow. flex align-items:center was what
      //   content-shrunk Alert/Surface under #36.
      const layout = (context.parameters.layout as string) ?? "centered";
      const centered = layout === "centered";
      return (
        <FontReady>
          <div
            data-theme={theme}
            style={{
              ...(centered
                ? {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 320,
                    minHeight: 120,
                    borderRadius: 8,
                  }
                : {
                    display: "block",
                    boxSizing: "border-box",
                    width: "100%",
                    minHeight: "100vh",
                  }),
              padding: 24,
              background: "var(--i258-background)",
              color: "var(--i258-foreground)",
              fontFamily: "var(--i258-font-sans)",
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
