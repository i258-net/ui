import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import type { CheckboxRootProps } from "@base-ui/react/checkbox";

import { cn } from "../lib/utils.js";

export type CheckboxProps = CheckboxRootProps;

export const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(
  function Checkbox({ className, nativeButton = true, ...props }, ref) {
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        data-slot="checkbox"
        className={cn("i258-checkbox", className)}
        nativeButton={nativeButton}
        {...props}
      >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="i258-checkbox__indicator"
      >
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  },
);
