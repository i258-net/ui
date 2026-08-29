import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";
import "@i258/ui/styles.css";

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

/**
 * Theme host only — no card chrome.
 * Single `data-theme` root for VRT (never also on `<html>` — that broke
 * Playwright's strict locator). Flat `--i258-background` always so Docs
 * examples aren't light text on Storybook's white preview. In story view,
 * also paint iframe `body` from the host's computed tokens for full-bleed
 * canvas without a second theme attribute.
 */
function ThemeHost({
  theme,
  paintCanvas,
  children,
}: {
  theme: string;
  paintCanvas: boolean;
  children: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paintCanvas || !hostRef.current) return;

    const body = document.body;
    const styles = getComputedStyle(hostRef.current);
    const prevBg = body.style.background;
    const prevColor = body.style.color;
    const prevFont = body.style.fontFamily;
    body.style.background = styles.getPropertyValue("--i258-background").trim();
    body.style.color = styles.getPropertyValue("--i258-foreground").trim();
    body.style.fontFamily = styles.getPropertyValue("--i258-font-sans").trim();

    return () => {
      body.style.background = prevBg;
      body.style.color = prevColor;
      body.style.fontFamily = prevFont;
    };
  }, [theme, paintCanvas]);

  return (
    <div
      ref={hostRef}
      data-theme={theme}
      style={{
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        background: "var(--i258-background)",
      }}
    >
      {children}
    </div>
  );
}

const preview: Preview = {
  // Autodocs for every CSF file; foundation demos opt out with `tags: ["!autodocs"]`.
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
      // Hide composition/escape-hatch props that leak from Base UI / HTML types.
      // Per-story `controls.include` further whitelists design props.
      exclude: ["asChild", "render", "className", "style", "ref", "nativeButton"],
    },
    // Fail story tests / CI on axe violations (was "todo" — panel-only).
    a11y: { test: "error" },
    layout: "centered",
    // Chromatic light/dark modes live on the 9 pilot stories only
    // (see chromaticPilotParameters) — not here. Global modes × a shared
    // decorator change inflated UI Tests accepts to 52×2 on ui#39.
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
      // Docs embeds many stories in one document — don't fight over body paint.
      const paintCanvas = context.viewMode === "story";
      return (
        <FontReady>
          <ThemeHost theme={theme} paintCanvas={paintCanvas}>
            <Story />
          </ThemeHost>
        </FontReady>
      );
    },
  ],
};

export default preview;
