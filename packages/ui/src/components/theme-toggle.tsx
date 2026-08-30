"use client";

import * as React from "react";

import { Button, type ButtonProps } from "./button.js";
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
  "children" | "onClick" | "aria-pressed" | "aria-label"
> & {
  /** localStorage key — must match `themeScript({ storageKey })`. */
  storageKey?: string;
};

/**
 * Ghost button that toggles `data-theme` between light and dark and persists
 * the choice. Pair with {@link themeScript} in the document head so the first
 * paint matches storage.
 */
export const ThemeToggle = React.forwardRef<HTMLElement, ThemeToggleProps>(
  function ThemeToggle(
    {
      storageKey = THEME_STORAGE_KEY,
      variant = "ghost",
      size = "sm",
      type,
      ...props
    },
    ref,
  ) {
    const [theme, setTheme] = React.useState<Theme>(DEFAULT_THEME);

    React.useEffect(() => {
      const stored = readStoredTheme(storageKey);
      setTheme(stored);
      applyTheme(stored);
    }, [storageKey]);

    const next: Theme = theme === "dark" ? "light" : "dark";

    return (
      <Button
        ref={ref}
        data-slot="theme-toggle"
        variant={variant}
        size={size}
        type={type ?? "button"}
        aria-label={`Switch to ${next} theme`}
        aria-pressed={theme === "dark"}
        onClick={() => {
          setTheme(next);
          applyTheme(next);
          persistTheme(next, storageKey);
        }}
        {...props}
      >
        {next === "light" ? "Light" : "Dark"}
      </Button>
    );
  },
);
