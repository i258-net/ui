import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type { TooltipPositionerProps, TooltipProviderProps as BaseProviderProps } from "@base-ui/react/tooltip";

import { useFrameLayer } from "../lib/frame-context.js";
import { cn } from "../lib/utils.js";

export type TooltipProviderProps = BaseProviderProps;

/**
 * Shares one open delay across the tooltips inside it, so moving between
 * neighbours (rail icons, a row of glyphs) shows the next tip at once.
 */
export function TooltipProvider({ delay = 400, closeDelay = 100, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay} closeDelay={closeDelay} {...props} />;
}

export type TooltipProps = {
  /** What the tip says. Keep it short: it is a visual label, not content. */
  content: React.ReactNode;
  /**
   * The trigger, rendered as-is (no wrapper), and it keeps its own
   * semantics. The tip is `aria-hidden`, so the trigger must carry its own
   * words:
   * - a focusable element (button, link) opens the tip on keyboard focus
   *   too, and needs its own accessible name (`aria-label` on an icon
   *   button);
   * - a non-focusable glyph (`<span>`) is hover-only, so its words must be
   *   in the accessibility tree some other way (visually hidden text).
   */
  children: React.ReactElement;
  side?: TooltipPositionerProps["side"];
  align?: TooltipPositionerProps["align"];
  /** Gap between the trigger and the tip, px. Default 6. */
  sideOffset?: number | undefined;
  /** Open delay on hover, ms. Default: the provider's, else Base UI's 600. */
  delay?: number | undefined;
  closeDelay?: number | undefined;
  disabled?: boolean | undefined;
  /**
   * Controlled open state, for a trigger with its own way in (a touch
   * long-press). Hover, focus and Escape still report through
   * `onOpenChange`; leave it unset otherwise.
   */
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  /**
   * Where the tip portals to. Default: the enclosing AppFrame's layer (so
   * it inherits the frame's theme), else `document.body`.
   */
  container?: HTMLElement | null | undefined;
};

/**
 * A visual label for an icon-only control or a glyph, on Base UI's
 * Tooltip. Meets WCAG 1.4.13: the tip is hoverable (the pointer can move
 * onto it), persistent (it stays until hover or focus leaves) and
 * dismissible (Escape closes it without moving focus or the pointer). It
 * opens on hover and keyboard focus, never on a tap (a tap is the
 * trigger's own action). A trigger can add a touch gesture of its own
 * through `open` / `onOpenChange`, as the sidebar rail does with a
 * long-press.
 *
 * Escape while a tip is open closes only the tip, however it opened
 * (hover with focus elsewhere included). The key is taken in the capture
 * phase at the window, its default prevented and its propagation stopped,
 * so an enclosing Dialog, sheet or menu stays open and app Escape handlers
 * (useShortcut) wait for the next press.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  delay,
  closeDelay,
  disabled,
  open: openProp,
  onOpenChange,
  className,
  container,
}: TooltipProps) {
  const frameLayer = useFrameLayer();
  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = openProp ?? innerOpen;
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  const setOpen = React.useCallback((next: boolean) => {
    setInnerOpen(next);
    onOpenChangeRef.current?.(next);
  }, []);
  const actions = React.useRef<TooltipPrimitive.Root.Actions | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      // The window's capture phase runs before any document listener.
      // useShortcut skips a prevented key; another library's dialog may
      // not look, so the key goes no further. (Base UI's own dialogs and
      // menus already leave Escape to an open tip inside them.)
      event.preventDefault();
      event.stopPropagation();
      actions.current?.close();
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, setOpen]);

  return (
    <TooltipPrimitive.Root
      actionsRef={actions}
      onOpenChange={setOpen}
      {...(openProp !== undefined ? { open: openProp } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
    >
      <TooltipPrimitive.Trigger
        render={children}
        {...(delay !== undefined ? { delay } : {})}
        {...(closeDelay !== undefined ? { closeDelay } : {})}
      />
      <TooltipPrimitive.Portal container={container ?? frameLayer}>
        <TooltipPrimitive.Positioner
          className="i258-tooltip__positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            aria-hidden="true"
            className={cn("i258-tooltip", className)}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
