import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
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

export type LinkProps = useRender.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    /** @deprecated Prefer `render`. */
    asChild?: boolean;
  };

export const Link = React.forwardRef<HTMLElement, LinkProps>(
  function Link({
    className,
    variant,
    render,
    asChild = false,
    children,
    ...props
  }, ref) {
    const resolvedRender =
      render ??
      (asChild
        ? (React.Children.only(children) as React.ReactElement)
        : undefined);

    return useRender({
      defaultTagName: "a",
      ref,
      render: resolvedRender,
      props: mergeProps<"a">(
        {
          className: cn(linkVariants({ variant }), className),
          children: asChild ? undefined : children,
          "data-slot": "link",
        } as React.ComponentProps<"a">,
        props,
      ),
    });
  },
);

export { linkVariants };
