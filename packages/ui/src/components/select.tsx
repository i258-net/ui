import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils.js";

const selectVariants = cva("i258-select", {
  variants: {
    size: {
      sm: "i258-select--sm",
      md: "i258-select--md",
      lg: "i258-select--lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/** Single choice only: a fixed-height control can't show a `multiple` list. */
export type SelectProps = Omit<React.ComponentProps<"select">, "size" | "multiple"> &
  VariantProps<typeof selectVariants>;

/**
 * A native `<select>` in kit clothing. Native on purpose: the platform's
 * picker on touch, its keyboard behaviour, forced-colours support and no
 * portal. Inside FormField it gets the label, description and error like
 * an Input. `className` goes on the wrapper, which sizes it; every other
 * prop goes on the `<select>`.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, size, ...props },
  ref,
) {
  return (
    <span data-slot="select-wrap" className={cn(selectVariants({ size }), className)}>
      <select ref={ref} data-slot="select" className="i258-select__control" {...props} />
      <svg
        className="i258-select__chevron"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="m4 6 4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});

export { selectVariants };
