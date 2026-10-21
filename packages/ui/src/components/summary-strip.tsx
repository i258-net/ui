import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

export type SummaryStripProps = Omit<React.ComponentProps<"section">, "aria-label"> & {
  /** The region's name, e.g. "Board summary". Screen readers can skip it whole. */
  label: string;
};

/**
 * A row of counts above a view; each tile is a filter (toggle button), a
 * link, or a plain readout. A labelled region holding a list, so it is
 * announced as "Board summary, list, 8 items". Tiles wrap into as many
 * columns as fit (two at 320px); nothing scrolls sideways. Each child is
 * one list item, so pass tiles directly rather than in a fragment.
 */
export const SummaryStrip = React.forwardRef<HTMLElement, SummaryStripProps>(function SummaryStrip(
  { label, className, children, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      aria-label={label}
      data-slot="summary-strip"
      className={cn("i258-summary", className)}
      {...props}
    >
      <ul className="i258-summary__list">
        {React.Children.map(children, (child) =>
          child == null || typeof child === "boolean" ? null : (
            <li className="i258-summary__item">{child}</li>
          ),
        )}
      </ul>
    </section>
  );
});

const summaryTileVariants = cva("i258-summary-tile", {
  variants: {
    /**
     * State, never decoration, and never the only signal (the caption says
     * it in words, the glyph in shape):
     * - `warning` (amber): waiting on you. Nothing else is amber.
     * - `danger`: broken data or a failing check.
     * - `success`: a check that passes.
     * - `neutral`: everything else, drift and blocked included.
     */
    tone: {
      neutral: "i258-summary-tile--neutral",
      warning: "i258-summary-tile--warning",
      danger: "i258-summary-tile--danger",
      success: "i258-summary-tile--success",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

export type SummaryTileProps = Omit<useRender.ComponentProps<"button">, "children"> &
  VariantProps<typeof summaryTileVariants> & {
    label: React.ReactNode;
    /**
     * The number; it leads the accessible name ("9 Decisions waiting on
     * you"). `"—"` means unknown (a failed load), never a fake zero; it is
     * read as "Unknown".
     */
    count: React.ReactNode;
    /** A short qualifier under the label: "waiting on you", "≥ 14 d". */
    caption?: React.ReactNode | undefined;
    /** Decorative glyph. Give each tile its own shape, so tone isn't the only cue. */
    icon?: React.ReactNode | undefined;
    /**
     * Filter state: makes the tile a toggle button (`aria-pressed`). Leave
     * it out for a link (`render={<a href="…" />}`) or a readout
     * (`render={<div />}`).
     */
    pressed?: boolean | undefined;
    /**
     * Keep the tone at zero: a passing check is still worth its green. An
     * unknown count (`"—"`) stays toneless regardless.
     */
    alert?: boolean | undefined;
  };

/**
 * Count + label tile. The tone shows only while the count is non-zero (or
 * `alert`) and known, so a healthy view looks quiet. Pressed is drawn as an
 * indicator edge plus a ✓ box in place of the glyph, not by tint alone.
 */
export const SummaryTile = React.forwardRef<HTMLElement, SummaryTileProps>(function SummaryTile(
  { label, count, caption, icon, pressed, alert, tone, className, render, type, ...props },
  ref,
) {
  // "—" is unknown: no tone, even with `alert`; it would claim a state we
  // don't have.
  const unknown = count === "—";
  const quiet = unknown || (!alert && (count === 0 || count === "0"));
  return useRender({
    defaultTagName: "button",
    ref,
    render,
    props: mergeProps<"button">(
      {
        className: cn(summaryTileVariants({ tone }), className),
        // Default to "button" only on our own <button>; with `render`, pass an
        // explicit `type` through (a rendered <button> would otherwise submit).
        type: render ? type : (type ?? "button"),
        "aria-pressed": pressed,
        "data-zero": quiet ? "" : undefined,
        "data-slot": "summary-tile",
        children: (
          <>
            <span className="i258-summary-tile__count">
              {count === "—" ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="i258-sr-only">Unknown</span>
                </>
              ) : (
                count
              )}
            </span>{" "}
            <span className="i258-summary-tile__label">{label}</span>
            {icon != null ? (
              <span className="i258-summary-tile__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            {caption != null ? (
              <>
                {" "}
                <span className="i258-summary-tile__caption">{caption}</span>
              </>
            ) : null}
          </>
        ),
      } as React.ComponentProps<"button">,
      props,
    ),
  });
});

export { summaryTileVariants };
