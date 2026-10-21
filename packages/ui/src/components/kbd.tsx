import * as React from "react";

import { cn } from "../lib/utils.js";

export type KbdProps = React.ComponentProps<"kbd">;

/**
 * A key cap: one key or chord, e.g. `<Kbd>⌘K</Kbd>` or
 * `<Kbd>{formatShortcut("mod+k")}</Kbd>`. A hint, not part of a name:
 * inside a button give it `aria-hidden` (the name stays "Approve", not
 * "Approve 1") and put the binding in the button's `aria-keyshortcuts`.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, ...props },
  ref,
) {
  return <kbd ref={ref} data-slot="kbd" className={cn("i258-kbd", className)} {...props} />;
});
