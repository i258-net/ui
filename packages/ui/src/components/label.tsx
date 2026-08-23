import * as React from "react";

import { cn } from "../lib/utils.js";

export type LabelProps = React.ComponentProps<"label">;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        data-slot="label"
        className={cn("i258-label", className)}
        {...props}
      />
    );
  },
);
