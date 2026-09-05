"use client";

/**
 * Sun/moon motion adapted from toggles.dev Classic
 * (https://toggles.dev/toggles/classic — MIT, theme-toggles / Alfie Jones).
 * Rewritten for `@i258/ui`: plain CSS under `@layer i258-components`, driven by
 * `aria-pressed` (dark) instead of Tailwind `dark:` utilities.
 */

import * as React from "react";

import { Button, type ButtonProps } from "./button.js";
import { cn } from "../lib/utils.js";
import {
  applyTheme,
  DEFAULT_THEME,
  persistTheme,
  readStoredTheme,
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
 * Ghost icon button that toggles `data-theme` between light and dark and
 * persists the choice. Pair with {@link themeScript} in the document head so
 * the first paint matches storage.
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
    const [theme, setTheme] = React.useState<Theme>(DEFAULT_THEME);

    React.useEffect(() => {
      const stored = readStoredTheme(storageKey);
      setTheme(stored);
      applyTheme(stored);
    }, [storageKey]);

    const next: Theme = theme === "dark" ? "light" : "dark";
    const dark = theme === "dark";

    return (
      <Button
        ref={ref}
        data-slot="theme-toggle"
        variant={variant}
        size={size}
        type={type ?? "button"}
        title={title}
        aria-label={`Switch to ${next} theme`}
        aria-pressed={dark}
        className={cn("i258-theme-toggle", className)}
        style={
          {
            ...style,
            ["--i258-theme-toggle-duration" as string]: `${duration}ms`,
          } as React.CSSProperties
        }
        onClick={() => {
          setTheme(next);
          applyTheme(next);
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
