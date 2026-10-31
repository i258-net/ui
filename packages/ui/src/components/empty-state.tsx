import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils.js";

const emptyStateVariants = cva("i258-empty", {
  variants: {
    /**
     * `neutral`: nothing here yet, or no results. `warning`: the data may be
     * out of date. `danger`: it failed to load. The tone colours the glyph
     * only; the title says what happened.
     */
    tone: {
      neutral: "i258-empty--neutral",
      warning: "i258-empty--warning",
      danger: "i258-empty--danger",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

export type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof emptyStateVariants> & {
    /** Decorative glyph above the title. */
    icon?: React.ReactNode | undefined;
    title: React.ReactNode;
    /** The title's heading level: whatever fits the page outline. Default 2. */
    headingLevel?: 2 | 3 | 4 | undefined;
    /** Buttons or links: what to do next (clear filters, retry). */
    actions?: React.ReactNode | undefined;
  };

/**
 * Nothing-here, no-results and failed-to-load panels: one shape for all
 * three, so a system state never looks like a broken layout. A state that
 * appears after the page loads (a failed refresh) should be announced by
 * the app, e.g. `role="status"` or a live region around it.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { className, tone, icon, title, headingLevel = 2, actions, children, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      ref={ref}
      data-slot="empty-state"
      className={cn(emptyStateVariants({ tone }), className)}
      {...props}
    >
      {icon != null ? (
        <div className="i258-empty__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <Heading className="i258-empty__title">{title}</Heading>
      {children != null ? <div className="i258-empty__body">{children}</div> : null}
      {actions != null ? <div className="i258-empty__actions">{actions}</div> : null}
    </div>
  );
});

export { emptyStateVariants };
