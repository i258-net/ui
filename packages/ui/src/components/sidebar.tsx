import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { BaseUIEvent } from "@base-ui/react/types";

import { SidebarHandleContext, SidebarModeContext } from "../lib/frame-context.js";
import { cn } from "../lib/utils.js";
import { Tooltip, TooltipProvider } from "./tooltip.js";

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
      {/* The rail's own provider, so moving along it shows each name at
          once. Apps need not mount one for the rail. */}
      <TooltipProvider delay={300}>{children}</TooltipProvider>
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
 * for a router link. In the rail its name (and count) shows as a Tooltip on
 * hover, keyboard focus and a touch long-press; the link keeps its own
 * accessible name.
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
    const longPress = useLongPress(collapsed);
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
        longPress.triggerProps,
      ),
    });
    // Always mounted (disabled while expanded) so the item element is the
    // same node in both modes and a collapse keeps focus on it.
    return (
      <li className="i258-sidebar__li">
        <Tooltip
          disabled={!collapsed}
          open={longPress.open}
          onOpenChange={longPress.setOpen}
          side="inline-end"
          sideOffset={8}
          className="i258-sidebar__tip"
          content={
            <>
              {children}
              {count != null ? (
                <span className="i258-sidebar__tip-count">{count}</span>
              ) : null}
            </>
          }
        >
          {link}
        </Tooltip>
      </li>
    );
  },
);

/** How long a touch must rest on a rail item to show its name, ms. */
const LONG_PRESS_MS = 500;
/** Finger travel that turns a press into a scroll, px. */
const LONG_PRESS_SLOP = 10;

/*
  Rail names on touch. The kit Tooltip never opens on a tap (a tap
  follows the link), so a long-press shows the name instead, as native
  toolbars do. The press does not also navigate, open the browser's link
  menu or select text; the tip stays until the next tap elsewhere or
  Escape. Mouse and pen leave it to the Tooltip's hover and focus.
*/
function useLongPress(enabled: boolean) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = React.useRef<{ x: number; y: number } | null>(null);
  const suppressClick = React.useRef(false);

  const cancel = React.useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    origin.current = null;
  }, []);
  const show = React.useCallback(() => {
    cancel();
    suppressClick.current = true;
    setOpen(true);
  }, [cancel]);

  React.useEffect(() => {
    if (enabled) return;
    cancel();
    setOpen(false);
  }, [enabled, cancel]);
  React.useEffect(() => cancel, [cancel]);

  const triggerProps: React.ComponentProps<"a"> = enabled
    ? {
        onPointerDown(event) {
          suppressClick.current = false;
          if (event.pointerType !== "touch" || !event.isPrimary) return;
          cancel();
          origin.current = { x: event.clientX, y: event.clientY };
          timer.current = setTimeout(show, LONG_PRESS_MS);
        },
        onPointerMove(event) {
          const o = origin.current;
          if (!o || event.pointerType !== "touch") return;
          if (Math.hypot(event.clientX - o.x, event.clientY - o.y) > LONG_PRESS_SLOP) cancel();
        },
        onKeyDown() {
          suppressClick.current = false;
        },
        onPointerUp: cancel,
        onPointerCancel: cancel,
        // Android raises the link menu on a long-press, at about the same
        // moment as the timer: take it as the long-press.
        onContextMenu(event) {
          if (origin.current == null && !suppressClick.current) return;
          event.preventDefault();
          if (!suppressClick.current) show();
        },
        // Some browsers still send a click when the finger lifts. It must
        // neither follow the link nor close the tip it just opened.
        onClick(event) {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          (event as BaseUIEvent<typeof event>).preventBaseUIHandler();
        },
      }
    : {};

  return { open, setOpen, triggerProps };
}
