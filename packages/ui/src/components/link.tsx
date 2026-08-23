import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const linkVariants = cva("i258-link", {
  variants: {
    variant: {
      accent: "i258-link--accent",
      muted: "i258-link--muted",
      subtle: "i258-link--subtle",
    },
  },
  defaultVariants: {
    variant: "accent",
  },
});

export type LinkProps = React.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    asChild?: boolean;
  };

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ className, variant, asChild = false, ...props }, ref) {
    const Comp = asChild ? Slot : "a";
    return (
      <Comp
        ref={ref}
        data-slot="link"
        className={cn(linkVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

export { linkVariants };
