import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
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

export type SurfaceProps = useRender.ComponentProps<"div"> &
  VariantProps<typeof surfaceVariants> & {
    /** @deprecated Prefer `render`. */
    asChild?: boolean;
  };

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(
  function Surface(
    {
      className,
      variant,
      padding,
      render,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) {
    const resolvedRender =
      render ??
      (asChild
        ? (React.Children.only(children) as React.ReactElement)
        : undefined);

    return useRender({
      defaultTagName: "div",
      ref,
      render: resolvedRender,
      props: mergeProps<"div">(
        {
          className: cn(surfaceVariants({ variant, padding }), className),
          children: asChild ? undefined : children,
          "data-slot": "surface",
        } as React.ComponentProps<"div">,
        props,
      ),
    });
  },
);

export { surfaceVariants };
