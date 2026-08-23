import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const alertVariants = cva("i258-alert", {
  variants: {
    tone: {
      info: "i258-alert--info",
      success: "i258-alert--success",
      warning: "i258-alert--warning",
      danger: "i258-alert--danger",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

export type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Optional heading rendered before children. */
    title?: React.ReactNode;
  };

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert({ className, tone, title, children, role, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert"
        role={role ?? (tone === "danger" ? "alert" : "status")}
        className={cn(alertVariants({ tone }), className)}
        {...props}
      >
        {title != null ? (
          <div data-slot="alert-title" className="i258-alert__title">
            {title}
          </div>
        ) : null}
        {children != null ? (
          <div data-slot="alert-body" className="i258-alert__body">
            {children}
          </div>
        ) : null}
      </div>
    );
  },
);

export { alertVariants };
