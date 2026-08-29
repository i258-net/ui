import * as React from "react";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const fieldsetLegendVariants = cva("i258-fieldset__legend", {
  variants: {
    emphasis: {
      default: "i258-fieldset__legend--default",
      primary: "i258-fieldset__legend--primary",
    },
  },
  defaultVariants: {
    emphasis: "default",
  },
});

export type FieldsetProps = Omit<
  React.ComponentProps<"fieldset">,
  "children"
> &
  VariantProps<typeof fieldsetLegendVariants> & {
    /** Group legend — wired to the underlying `<fieldset>` for assistive tech. */
    legend: React.ReactNode;
    /** Chip rows, actions, and other grouped controls. */
    children: React.ReactNode;
  };

export const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset(
    { className, legend, emphasis = "default", children, ...props },
    ref,
  ) {
    return (
      <FieldsetPrimitive.Root
        ref={ref}
        data-slot="fieldset"
        className={cn("i258-fieldset", className)}
        {...props}
      >
        <FieldsetPrimitive.Legend
          data-slot="fieldset-legend"
          className={cn(fieldsetLegendVariants({ emphasis }))}
        >
          {legend}
        </FieldsetPrimitive.Legend>
        {children}
      </FieldsetPrimitive.Root>
    );
  },
);

export { fieldsetLegendVariants };
