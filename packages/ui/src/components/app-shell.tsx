import * as React from "react";

import { ThemeToggle } from "./theme-toggle.js";
import { cn } from "../lib/utils.js";

export type AppShellProps = Omit<React.ComponentProps<"header">, "title"> & {
  /**
   * App or page name. The kit renders the `<h1>` itself so the title is the
   * same size in every app — pass text, not your own heading element.
   */
  title: React.ReactNode;
  /** Short qualifier beside the title, e.g. "Beans operator view". */
  subtitle?: React.ReactNode;
  /** Primary in-app nav. */
  nav?: React.ReactNode;
  /** Secondary facts — counts, paths, freshness. Monospaced and muted. */
  meta?: React.ReactNode;
  /** Domain actions, rendered before the theme toggle. */
  end?: React.ReactNode;
  /**
   * Signed-in identity. Reading it is app-owned (forward-auth headers differ
   * per app); the kit owns how it looks. Pass the display name.
   */
  user?: React.ReactNode;
  /** Set `false` when the app renders its own theme control inside `end`. */
  themeToggle?: boolean;
};

/**
 * Shared application chrome: heading · nav · meta · (end + theme + identity).
 *
 * One bar shape across apps — the title size, subtitle treatment, muted meta
 * and identity truncation are fixed here rather than restated per app.
 */
export const AppShell = React.forwardRef<HTMLElement, AppShellProps>(
  function AppShell(
    {
      title,
      subtitle,
      nav,
      meta,
      end,
      user,
      themeToggle = true,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <header
        ref={ref}
        className={cn("i258-app-shell", className)}
        data-slot="app-shell"
        {...props}
      >
        <div className="i258-app-shell__heading">
          <h1 className="i258-app-shell__title">{title}</h1>
          {subtitle != null ? (
            <p className="i258-app-shell__subtitle">{subtitle}</p>
          ) : null}
        </div>
        {nav != null ? <div className="i258-app-shell__nav">{nav}</div> : null}
        {meta != null ? (
          <div className="i258-app-shell__meta">{meta}</div>
        ) : null}
        <div className="i258-app-shell__end">
          {end}
          {themeToggle ? <ThemeToggle /> : null}
          {user != null ? (
            <div className="i258-app-shell__user">{user}</div>
          ) : null}
        </div>
      </header>
    );
  },
);
