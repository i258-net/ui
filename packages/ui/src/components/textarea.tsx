import * as React from "react";
import { Field } from "@base-ui/react/field";
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

/**
 * Field-aware `<textarea>` — Base UI has no Textarea primitive, so this wraps
 * `Field.Control` with a styled textarea render prop.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, size, rows = 3, ...props }, ref) {
    return (
      <Field.Control
        ref={ref as React.Ref<HTMLElement>}
        render={
          <textarea
            data-slot="textarea"
            rows={rows}
            className={cn(textareaVariants({ size }), className)}
          />
        }
        {...(props as Omit<Field.Control.Props, "render">)}
      />
    );
  },
);

export { textareaVariants };
