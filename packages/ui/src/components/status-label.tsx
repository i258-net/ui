import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const statusLabelVariants = cva("i258-status", {
  variants: {
    /**
     * State, never decoration, and never the only signal: the word says it.
     * - `warning` (amber): waiting on you. Blocked, missing priority and
     *   drift are not — give them `neutral` or `muted` and their own glyph.
     * - `danger`: broken data or a failing check.
     * - `success`: done, or a check that passes.
     * - `accent`: in progress / current.
     */
    tone: {
      neutral: "i258-status--neutral",
      muted: "i258-status--muted",
      accent: "i258-status--accent",
      success: "i258-status--success",
      warning: "i258-status--warning",
      danger: "i258-status--danger",
    },
    size: {
      sm: "i258-status--sm",
      md: "i258-status--md",
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
});

export type StatusLabelProps = React.ComponentProps<"span"> &
  VariantProps<typeof statusLabelVariants> & {
    /** Leading glyph. Decorative: hidden from assistive tech, the word carries the meaning. */
    icon?: React.ReactNode | undefined;
    /** A soft wash of the tone behind the label, for a status that stands alone. */
    tinted?: boolean | undefined;
  };

/**
 * A status as glyph + word, with colour on the status only, never on the
 * row around it. The kit owns the shape and the tones; the app owns which
 * of its values maps to which tone.
 */
export const StatusLabel = React.forwardRef<HTMLSpanElement, StatusLabelProps>(
  function StatusLabel({ className, tone, size, icon, tinted = false, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="status-label"
        data-tinted={tinted ? "" : undefined}
        className={cn(statusLabelVariants({ tone, size }), className)}
        {...props}
      >
        {icon != null ? (
          <span className="i258-status__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="i258-status__label">{children}</span>
      </span>
    );
  },
);

export { statusLabelVariants };
