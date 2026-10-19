import * as React from "react";

import { cn } from "../lib/utils.js";

export type PaneResizeHandleProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "children"
> & {
  /** Accessible name, e.g. "Resize sidebar". */
  label: string;
  /** Current pane width in CSS px. */
  value: number;
  min: number;
  max: number;
  onValueChange: (width: number) => void;
  /**
   * Which inline edge of the pane the handle sits on. `end` (a start pane's
   * trailing edge) grows toward the inline end; `start` (an end pane's
   * leading edge) grows toward the inline start. Mirrors under `dir="rtl"`.
   */
  edge: "start" | "end";
  /** Enter / double-click: reset or collapse — the app decides which. */
  onActivate?: (() => void) | undefined;
  /** Id of the pane being resized. */
  controls?: string | undefined;
  /** Arrow-key step in px; Shift multiplies it by 4. Default 16. */
  step?: number | undefined;
};

const RESIZING = "i258Resizing";

/**
 * Window-splitter pattern: a focusable `role="separator"` with a value.
 * Drag with a pointer, or focus it and use ←/→ (Shift for bigger steps),
 * Home/End for min/max, Enter to run `onActivate`.
 *
 * Its hit area is a reserved strip beside the pane edge (24px, 44px on
 * coarse pointers); AppFrame pads the neighbouring content so no other
 * target sits under it.
 */
export function PaneResizeHandle({
  label,
  value,
  min,
  max,
  onValueChange,
  edge,
  onActivate,
  controls,
  step = 16,
  className,
  ...props
}: PaneResizeHandleProps) {
  const clamp = (n: number) => Math.round(Math.min(max, Math.max(min, n)));
  const drag = React.useRef<{ x: number; w: number; dir: number } | null>(null);

  // Physical direction a growing pane moves its edge: +1 is rightward.
  const growDir = (el: HTMLElement) => {
    const rtl = getComputedStyle(el).direction === "rtl";
    return (edge === "end" ? 1 : -1) * (rtl ? -1 : 1);
  };

  const endDrag = React.useCallback(() => {
    drag.current = null;
    delete document.documentElement.dataset[RESIZING];
  }, []);

  // Unmounted mid-drag (e.g. the app collapsed the pane): don't leave the
  // document stuck in col-resize / no-select.
  React.useEffect(() => endDrag, [endDrag]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-controls={controls}
      tabIndex={0}
      data-slot="pane-resize-handle"
      data-edge={edge}
      className={cn("i258-resize-handle", className)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, w: value, dir: growDir(e.currentTarget) };
        document.documentElement.dataset[RESIZING] = "";
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        onValueChange(clamp(d.w + (e.clientX - d.x) * d.dir));
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={onActivate}
      onKeyDown={(e) => {
        const by = e.shiftKey ? step * 4 : step;
        const dir = growDir(e.currentTarget);
        let next: number | null = null;
        if (e.key === "ArrowRight") next = value + by * dir;
        else if (e.key === "ArrowLeft") next = value - by * dir;
        else if (e.key === "Home") next = min;
        else if (e.key === "End") next = max;
        else if (e.key === "Enter" && onActivate) {
          e.preventDefault();
          onActivate();
          return;
        }
        if (next === null) return;
        e.preventDefault();
        onValueChange(clamp(next));
      }}
      {...props}
    />
  );
}
