import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { Tooltip } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";

import {
  FramePortalContext,
  SidebarHandleContext,
  SidebarModeContext,
} from "../lib/frame-context.js";
import { cn } from "../lib/utils.js";

/**
 * Whether the sidebar is drawn as an icon rail. AppFrame provides it; use
 * it for app content inside the sidebar that should change in the rail.
 * (Text marked `data-sidebar-text` is visually hidden there automatically.)
 */
export function useSidebarCollapsed(): boolean {
  return React.useContext(SidebarModeContext) === "rail";
}

export type SidebarProps = React.ComponentProps<"aside">;

/**
 * Start-side sidebar: header (app identity / search), a `nav` of
 * collapsible sections, and a footer. Inside AppFrame it can be drawn as an
 * icon rail; item labels stay in the accessibility tree either way.
 */
export function Sidebar({
  className,
  children,
  "aria-label": ariaLabel = "Sidebar",
  ...props
}: SidebarProps) {
  const collapsed = useSidebarCollapsed();
  const handle = React.useContext(SidebarHandleContext);
  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed ? "" : undefined}
      aria-label={ariaLabel}
      className={cn("i258-sidebar", className)}
      {...props}
    >
      {/* One provider so moving along the rail shows each name at once. */}
      <Tooltip.Provider delay={300}>{children}</Tooltip.Provider>
      {handle}
    </aside>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("i258-sidebar__header", className)} {...props} />;
}

/** The sidebar's navigation landmark. Holds SidebarSections. */
export function SidebarContent({
  className,
  "aria-label": ariaLabel = "Primary",
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn("i258-sidebar__content", className)}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("i258-sidebar__footer", className)} {...props} />;
}

export type SidebarSectionProps = {
  title: string;
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

/**
 * A titled list of items whose header collapses it. In the rail the header
 * becomes a divider and the section is forced open, so every item stays
 * reachable.
 */
export function SidebarSection({
  title,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  className,
}: SidebarSectionProps) {
  const collapsed = useSidebarCollapsed();
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const isOpen = collapsed ? true : (open ?? innerOpen);
  const titleId = React.useId();
  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (collapsed) return;
        setInnerOpen(next);
        onOpenChange?.(next);
      }}
      className={cn("i258-sidebar__section", className)}
    >
      <Collapsible.Trigger className="i258-sidebar__section-trigger">
        <span id={titleId}>{title}</span>
        <svg
          className="i258-sidebar__chevron"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="m6 4 4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Collapsible.Trigger>
      <Collapsible.Panel className="i258-sidebar__section-panel" keepMounted>
        <ul className="i258-sidebar__list" aria-labelledby={titleId}>
          {children}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export type SidebarItemProps = Omit<useRender.ComponentProps<"a">, "children"> & {
  icon?: React.ReactNode | undefined;
  /** The item's name. Also its tooltip in the rail. */
  children: React.ReactNode;
  /** Count shown on the end. */
  count?: React.ReactNode | undefined;
  /** Screen-reader wording for the count, e.g. "31 open". */
  countLabel?: string | undefined;
  /** Colour the count as a state (e.g. failures). */
  countTone?: "default" | "danger" | "warning" | undefined;
  /**
   * Marks the current item. `true` → `aria-current="page"`. Pass `"true"`
   * for a parent of the current page or `"location"` for an in-page
   * section, so only one item in the nav claims "page".
   */
  current?: boolean | "page" | "true" | "location" | undefined;
};

/**
 * A navigation link in a SidebarSection. Renders an `<a>`; pass `render`
 * for a router link. In the rail its name shows on hover and keyboard focus.
 */
export const SidebarItem = React.forwardRef<HTMLElement, SidebarItemProps>(
  function SidebarItem(
    {
      icon,
      children,
      count,
      countLabel,
      countTone = "default",
      current = false,
      render,
      className,
      ...props
    },
    ref,
  ) {
    const collapsed = useSidebarCollapsed();
    const link = useRender({
      defaultTagName: "a",
      ref,
      render,
      props: mergeProps<"a">(
        {
          "aria-current": current === true ? "page" : current || undefined,
          "data-current": current ? "" : undefined,
          className: cn("i258-sidebar__item", className),
          children: (
            <>
              {icon != null ? (
                <span className="i258-sidebar__icon" aria-hidden="true">
                  {icon}
                </span>
              ) : null}
              <span className="i258-sidebar__label">{children}</span>
              {count != null ? (
                <span className="i258-sidebar__count" data-tone={countTone}>
                  <span aria-hidden={countLabel ? true : undefined}>{count}</span>
                  {countLabel ? (
                    <span className="i258-sr-only">, {countLabel}</span>
                  ) : null}
                </span>
              ) : null}
            </>
          ),
        } as React.ComponentProps<"a">,
        props,
      ),
    });
    return (
      <li className="i258-sidebar__li">
        <RailName collapsed={collapsed} name={children} count={count}>
          {link}
        </RailName>
      </li>
    );
  },
);

/*
  Rail names. Private and deliberately minimal: a Base UI tooltip with no
  public API, so this PR does not ship the kit Tooltip ahead of its own
  review (I25-109). When that lands, swap this for it.

  Always mounted (disabled while expanded) so the item element is the same
  node in both modes and a collapse keeps focus on it. Portals into the
  frame's layer so it inherits the frame's theme and density.
*/
function RailName({
  collapsed,
  name,
  count,
  children,
}: {
  collapsed: boolean;
  name: React.ReactNode;
  count: React.ReactNode;
  children: React.ReactElement;
}) {
  const container = React.useContext(FramePortalContext);
  return (
    <Tooltip.Root disabled={!collapsed}>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={container}>
        <Tooltip.Positioner side="inline-end" sideOffset={8} className="i258-sidebar__tip-positioner">
          <Tooltip.Popup className="i258-sidebar__tip">
            {name}
            {count != null ? (
              <span className="i258-sidebar__tip-count">{count}</span>
            ) : null}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
