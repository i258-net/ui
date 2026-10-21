import { useEffect, useRef, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";
import "@i258/ui/styles.css";

/**
 * Gate Chromatic / Playwright VRT on the self-hosted face so snapshots
 * never capture system fallback metrics.
 *
 * A loader, not a decorator: loaders finish before the story renders, so a
 * play function never queries an empty canvas. As a decorator that rendered
 * `null` until the fonts resolved, any play story that ran first on a fresh
 * page (shuffled order, or `-t` on one story) found `<div />` and failed
 * (I25-117).
 */
async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('1em "Geist Sans"'),
      document.fonts.load('1em "Geist Mono"'),
      document.fonts.load('1em "i258 Symbols"', "⌃⌘⌥⌫✓"),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall through — better a fallback snapshot than a hung story.
  }
  return {};
}

/** Token names the Storybook backgrounds toolbar resolves via CSS vars. */
const CANVAS_TOKEN_VARS = [
  "--i258-background",
  "--i258-surface",
  "--i258-surface-raised",
  "--i258-foreground",
  "--i258-font-sans",
] as const;

/**
 * Docs autodocs mounts one ThemeHost per embed in the same document. Each
 * used to save/restore `:root` on cleanup; sibling unmounts (the old
 * FontReady gate / Strict Mode) wiped the dark tokens mid-paint — Mac VRT
 * captured white `.docs-story` canvases while Linux got settled dark (ui#42,
 * ratio 0.27).
 * Refcount: only clear `:root` when the last docs host unmounts.
 */
let docsRootMirrorCount = 0;

/**
 * Theme host only — no card chrome.
 * Single `data-theme` root for VRT. `<html>` can also carry one — a
 * story containing ThemeToggle sets it on mount — so VRT locators scope to
 * `#storybook-root`; an unscoped `[data-theme]` matches twice and trips
 * Playwright strict mode (ui#59). Docs keep a flat `--i258-background` so
 * examples aren't light text on Storybook's white preview. Story view: host
 * is transparent so the backgrounds addon (`.sb-show-main !important`) can
 * own the canvas — a painted host on a non-default swatch revived the
 * double-surface island. Mirror host tokens onto `:root` so
 * `var(--i258-*)` swatches resolve under the active theme without a second
 * `data-theme`. Body still gets colour/font (and a default background the
 * addon overrides when a swatch is selected).
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
    if (!hostRef.current) return;

    const host = hostRef.current;
    const styles = getComputedStyle(host);
    const root = document.documentElement;

    const applyRootTokens = () => {
      for (const name of CANVAS_TOKEN_VARS) {
        root.style.setProperty(name, styles.getPropertyValue(name).trim());
      }
    };

    // Docs: shared `:root` mirror — see docsRootMirrorCount above.
    if (!paintCanvas) {
      docsRootMirrorCount += 1;
      applyRootTokens();
      return () => {
        docsRootMirrorCount -= 1;
        if (docsRootMirrorCount === 0) {
          for (const name of CANVAS_TOKEN_VARS) {
            root.style.removeProperty(name);
          }
        }
      };
    }

    const prevRoot = new Map<string, string>();
    for (const name of CANVAS_TOKEN_VARS) {
      prevRoot.set(name, root.style.getPropertyValue(name));
    }
    applyRootTokens();

    const body = document.body;
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
      for (const name of CANVAS_TOKEN_VARS) {
        const prev = prevRoot.get(name) ?? "";
        if (prev) root.style.setProperty(name, prev);
        else root.style.removeProperty(name);
      }
    };
  }, [theme, paintCanvas]);

  return (
    <div
      ref={hostRef}
      data-theme={theme}
      style={{
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        // Story: transparent — canvas colour comes from body / backgrounds
        // addon. Docs: flat page token so embedded examples aren't on white.
        background: paintCanvas ? "transparent" : "var(--i258-background)",
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
    // Canvas swatches resolve through ThemeHost-mirrored --i258-* on :root
    // so the backgrounds toolbar and theme toolbar stay one story.
    // Note: light/dark --i258-surface and --i258-surface-raised differ in both
    // themes (Tokyo Night Day / Night in themes.css).
    backgrounds: {
      options: {
        background: { name: "background", value: "var(--i258-background)" },
        surface: { name: "surface", value: "var(--i258-surface)" },
        "surface-raised": {
          name: "surface-raised",
          value: "var(--i258-surface-raised)",
        },
      },
    },
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
    backgrounds: { value: "background" },
  },
  loaders: [fontsReady],
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "light";
      // Docs embeds many stories in one document — don't fight over body paint.
      const paintCanvas = context.viewMode === "story";
      return (
        <ThemeHost theme={theme} paintCanvas={paintCanvas}>
          <Story />
        </ThemeHost>
      );
    },
  ],
};

export default preview;
