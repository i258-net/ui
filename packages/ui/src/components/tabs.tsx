import type {
  TabsListProps as BaseListProps,
  TabsPanelProps as BasePanelProps,
  TabsTabProps as BaseTabProps,
  TabsRootProps,
} from "@base-ui/react/tabs";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";

import { cn } from "../lib/utils.js";

/*
  Tabs: views of one thing (an issue's Overview / Body / Log), on Base UI.
  ←/→ (or ↑/↓ when vertical) and Home/End move focus between tabs; Enter or
  Space selects (`activateOnFocus` on TabsList selects as focus moves).
  For moving between pages use links, not tabs.
*/

export type TabsProps = Omit<TabsRootProps, "className"> & {
  className?: string | undefined;
};

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      className={cn("i258-tabs", className)}
      {...props}
    />
  );
});

export type TabsListProps = Omit<BaseListProps, "className"> & {
  className?: string | undefined;
};

/**
 * The underlined tab strip; a column beside the panel when the Tabs are
 * vertical. Scrolls along its axis when the tabs don't fit.
 */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn("i258-tabs__list", className)}
      {...props}
    />
  );
});

export type TabProps = Omit<BaseTabProps, "className"> & {
  className?: string | undefined;
  /** A count after the label; part of the tab's name ("Log 12"). */
  count?: React.ReactNode | undefined;
};

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { className, count, children, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Tab
      ref={ref}
      data-slot="tab"
      className={cn("i258-tabs__tab", className)}
      {...props}
    >
      <span className="i258-tabs__label">{children}</span>
      {count != null ? (
        <>
          {" "}
          <span className="i258-tabs__count">{count}</span>
        </>
      ) : null}
    </TabsPrimitive.Tab>
  );
});

export type TabsPanelProps = Omit<BasePanelProps, "className"> & {
  className?: string | undefined;
};

export const TabsPanel = React.forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Panel
      ref={ref}
      data-slot="tabs-panel"
      className={cn("i258-tabs__panel", className)}
      {...props}
    />
  );
});
