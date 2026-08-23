import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const textareaVariants = cva("i258-textarea", {
  variants: {
    size: {
      sm: "i258-textarea--sm",
      md: "i258-textarea--md",
      lg: "i258-textarea--lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type TextareaProps = Omit<React.ComponentProps<"textarea">, "size"> &
  VariantProps<typeof textareaVariants>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, size, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        rows={rows}
        className={cn(textareaVariants({ size }), className)}
        {...props}
      />
    );
  },
);

export { textareaVariants };
