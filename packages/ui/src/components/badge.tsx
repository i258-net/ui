import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const badgeVariants = cva("i258-badge", {
  variants: {
    variant: {
      neutral: "i258-badge--neutral",
      accent: "i258-badge--accent",
      success: "i258-badge--success",
      warning: "i258-badge--warning",
      danger: "i258-badge--danger",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

export { badgeVariants };
