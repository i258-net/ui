import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const buttonVariants = cva("i258-btn", {
  variants: {
    variant: {
      primary: "i258-btn--primary",
      secondary: "i258-btn--secondary",
      ghost: "i258-btn--ghost",
      danger: "i258-btn--danger",
    },
    size: {
      sm: "i258-btn--sm",
      md: "i258-btn--md",
      lg: "i258-btn--lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, asChild = false, type, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        type={asChild ? undefined : (type ?? "button")}
        {...props}
      />
    );
  },
);

export { buttonVariants };
