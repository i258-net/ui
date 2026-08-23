import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const inputVariants = cva("i258-input", {
  variants: {
    size: {
      sm: "i258-input--sm",
      md: "i258-input--md",
      lg: "i258-input--lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, size, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        data-slot="input"
        type={type}
        className={cn(inputVariants({ size }), className)}
        {...props}
      />
    );
  },
);

export { inputVariants };
