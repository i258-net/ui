import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const toggleChipVariants = cva("i258-toggle-chip", {
  variants: {
    size: {
      sm: "i258-toggle-chip--sm",
      md: "i258-toggle-chip--md",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ToggleChipProps = Omit<
  React.ComponentProps<"button">,
  "children"
> &
  VariantProps<typeof toggleChipVariants> & {
    /** Whether the chip is in the pressed / selected state. */
    pressed?: boolean;
    /** Chip label. */
    children: React.ReactNode;
    /** Optional count rendered after the label (e.g. filter totals). */
    count?: React.ReactNode;
  };

export const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  function ToggleChip(
    {
      className,
      size,
      pressed = false,
      children,
      count,
      type,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        data-slot="toggle-chip"
        data-state={pressed ? "on" : "off"}
        type={type ?? "button"}
        aria-pressed={pressed}
        className={cn(toggleChipVariants({ size }), className)}
        {...props}
      >
        <span className="i258-toggle-chip__label">{children}</span>
        {count != null ? (
          <span className="i258-toggle-chip__count">{count}</span>
        ) : null}
      </button>
    );
  },
);

export { toggleChipVariants };
