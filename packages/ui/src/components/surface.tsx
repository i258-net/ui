import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const surfaceVariants = cva("i258-surface", {
  variants: {
    variant: {
      default: "i258-surface--default",
      raised: "i258-surface--raised",
      inset: "i258-surface--inset",
    },
    padding: {
      none: "i258-surface--p-none",
      sm: "i258-surface--p-sm",
      md: "i258-surface--p-md",
      lg: "i258-surface--p-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export type SurfaceProps = React.ComponentProps<"div"> &
  VariantProps<typeof surfaceVariants> & {
    asChild?: boolean;
  };

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(
    { className, variant, padding, asChild = false, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-slot="surface"
        className={cn(surfaceVariants({ variant, padding }), className)}
        {...props}
      />
    );
  },
);

export { surfaceVariants };
