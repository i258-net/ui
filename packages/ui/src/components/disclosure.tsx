import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import type { CollapsibleRootProps } from "@base-ui/react/collapsible";
import type { CollapsibleTriggerProps } from "@base-ui/react/collapsible";
import type { CollapsiblePanelProps } from "@base-ui/react/collapsible";

import { cn } from "../lib/utils.js";

export type DisclosureProps = CollapsibleRootProps;

export const Disclosure = React.forwardRef<HTMLDivElement, DisclosureProps>(
  function Disclosure({ className, ...props }, ref) {
    return (
      <Collapsible.Root
        ref={ref}
        data-slot="disclosure"
        className={cn("i258-disclosure", className)}
        {...props}
      />
    );
  },
);

export type DisclosureTriggerProps = CollapsibleTriggerProps;

export const DisclosureTrigger = React.forwardRef<
  HTMLButtonElement,
  DisclosureTriggerProps
>(function DisclosureTrigger({ className, ...props }, ref) {
  return (
    <Collapsible.Trigger
      ref={ref}
      data-slot="disclosure-trigger"
      className={cn("i258-disclosure__trigger", className)}
      {...props}
    />
  );
});

export type DisclosurePanelProps = CollapsiblePanelProps;

export const DisclosurePanel = React.forwardRef<
  HTMLDivElement,
  DisclosurePanelProps
>(function DisclosurePanel({ className, keepMounted = true, ...props }, ref) {
  return (
    <Collapsible.Panel
      ref={ref}
      data-slot="disclosure-panel"
      keepMounted={keepMounted}
      className={cn("i258-disclosure__panel", className)}
      {...props}
    />
  );
});
