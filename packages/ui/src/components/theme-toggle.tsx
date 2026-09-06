"use client";

/**
 * Sun/moon motion adapted from toggles.dev Classic
 * (https://toggles.dev/toggles/classic — MIT, theme-toggles / Alfie Jones).
 * Rewritten for `@i258/ui`: plain CSS under `@layer i258-components`, drawn
 * from the theme's own `--i258-theme-is-dark` instead of Tailwind `dark:`.
 */

import * as React from "react";

import { Button, type ButtonProps } from "./button.js";
import { cn } from "../lib/utils.js";
import {
  applyTheme,
  persistTheme,
  readAppliedTheme,
  subscribeToTheme,
  themeHostOf,
  THEME_STORAGE_KEY,
  type Theme,
} from "../lib/theme.js";

export type ThemeToggleProps = Omit<
  ButtonProps,
  "children" | "onClick" | "aria-pressed" | "aria-label" | "title"
> & {
  /** localStorage key — must match `themeScript({ storageKey })`. */
  storageKey?: string;
  /** Animation duration in ms (Classic default 400). */
  duration?: number;
  title?: string;
};

/**
 * Ghost icon button that flips `data-theme` on the nearest themed ancestor and
 * persists the choice. The icon is drawn from the active theme in CSS, so the
 * server HTML is already right; state carries the label only.
 */
export const ThemeToggle = React.forwardRef<HTMLElement, ThemeToggleProps>(
  function ThemeToggle(
    {
      storageKey = THEME_STORAGE_KEY,
      variant = "ghost",
      size = "sm",
      type,
      duration = 400,
      className,
      title = "Toggle theme",
      style,
      ...props
    },
    ref,
  ) {
    const reactId = React.useId();
    const clipMainId = `i258-theme-toggle-clip-${reactId.replace(/:/g, "")}`;
    const nodeRef = React.useRef<HTMLElement | null>(null);
    // `null` until mounted: the server cannot know the theme, and only the
    // label needs it. The icon comes from CSS.
    const [theme, setTheme] = React.useState<Theme | null>(null);

    const attachRef = React.useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // The icon is CSS, so it follows `data-theme` no matter who wrote it; the
    // label and `aria-pressed` have to be told. Watching the host we read from
    // makes this the single writer of `theme` — a change from anywhere else (a
    // second toggle, an app-level control, the Storybook toolbar) would
    // otherwise leave the announcement contradicting the icon, which is worse
    // than the two being wrong together.
    React.useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;
      const sync = () => setTheme(readAppliedTheme(node));
      sync();

      const observer = new MutationObserver(sync);
      observer.observe(themeHostOf(node), {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      // An unthemed page follows `prefers-color-scheme`: the computed value
      // flips with no attribute to mutate.
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", sync);

      return () => {
        observer.disconnect();
        media.removeEventListener("change", sync);
      };
    }, []);

    // Another tab changed the stored theme. `storage` never fires in the
    // document that wrote it, so this cannot echo the local click. Only the
    // attribute is written here; the observer above carries it to the label.
    React.useEffect(
      () =>
        subscribeToTheme((stored) => {
          if (!nodeRef.current) return;
          applyTheme(stored, themeHostOf(nodeRef.current));
        }, storageKey),
      [storageKey],
    );

    return (
      <Button
        ref={attachRef}
        data-slot="theme-toggle"
        variant={variant}
        size={size}
        type={type ?? "button"}
        title={title}
        aria-label={
          theme === null ? title : `Switch to ${theme === "dark" ? "light" : "dark"} theme`
        }
        aria-pressed={theme === null ? undefined : theme === "dark"}
        className={cn("i258-theme-toggle", className)}
        style={
          {
            ...style,
            ["--i258-theme-toggle-duration" as string]: `${duration}ms`,
          } as React.CSSProperties
        }
        onClick={(event) => {
          const host = themeHostOf(event.currentTarget);
          const next: Theme =
            readAppliedTheme(host) === "dark" ? "light" : "dark";
          applyTheme(next, host);
          persistTheme(next, storageKey);
        }}
        {...props}
      >
        <svg
          className="i258-theme-toggle__svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipMainId}>
              <path
                className="i258-theme-toggle__clip"
                d="M0 0h25a1 1 0 0010 10v14H0Z"
              />
            </clipPath>
          </defs>
          <g stroke="currentColor" strokeLinecap="round">
            <circle
              className="i258-theme-toggle__core"
              cx={12}
              cy={12}
              r={5}
              fill="currentColor"
              clipPath={`url(#${clipMainId})`}
            />
            {(
              [
                "M12 1.4v2.4",
                "m20.3 3.7-2.5 2.5",
                "M22.6 12h-2.4",
                "M12 22.6v-2.4",
                "M1.4 12h2.4",
                "m20.3 20.3-2.5-2.5",
                "m3.7 20.3 2.5-2.5",
                "m3.7 3.7 2.5 2.5",
              ] as const
            ).map((d) => (
              <path
                key={d}
                className="i258-theme-toggle__ray"
                d={d}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeMiterlimit={0}
                paintOrder="stroke markers fill"
              />
            ))}
          </g>
        </svg>
      </Button>
    );
  },
);
