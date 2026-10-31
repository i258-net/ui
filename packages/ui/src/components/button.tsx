import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

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
      xs: "i258-btn--xs",
      sm: "i258-btn--sm",
      md: "i258-btn--md",
      lg: "i258-btn--lg",
    },
    /** `icon`: square, for an icon-only button. Give it an `aria-label`. */
    shape: {
      default: "",
      icon: "i258-btn--icon",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    shape: "default",
  },
});

export type ButtonProps = useRender.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /**
     * @deprecated Prefer `render` (Base UI composition). Kept so existing
     * Radix-era `asChild` callers (Honeycomb board chrome) keep working.
     */
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, variant, size, shape, render, asChild = false, type, children, ...props },
  ref,
) {
  const resolvedRender =
    render ?? (asChild ? (React.Children.only(children) as React.ReactElement) : undefined);

  return useRender({
    defaultTagName: "button",
    ref,
    render: resolvedRender,
    props: mergeProps<"button">(
      {
        className: cn(buttonVariants({ variant, size, shape }), className),
        type: resolvedRender ? undefined : (type ?? "button"),
        children: asChild ? undefined : children,
        "data-slot": "button",
      } as React.ComponentProps<"button">,
      props,
    ),
  });
});

export { buttonVariants };
