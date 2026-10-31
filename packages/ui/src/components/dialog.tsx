import type {
  DialogCloseProps as BaseCloseProps,
  DialogDescriptionProps as BaseDescriptionProps,
  DialogTitleProps as BaseTitleProps,
  DialogTriggerProps as BaseTriggerProps,
  DialogPopupProps,
  DialogRootProps,
} from "@base-ui/react/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useFrameLayer } from "../lib/frame-context.js";
import { CloseIcon } from "../lib/icons.js";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";

export type DialogProps = DialogRootProps;

/**
 * A modal dialog: focus moves in and is trapped, the rest of the page is
 * inert, Escape and the backdrop close it, and focus returns to what opened
 * it. Controlled (`open` / `onOpenChange`) or uncontrolled with a
 * `DialogTrigger`. For the narrow-screen sidebar and inspector use AppFrame,
 * which owns those sheets.
 */
export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root {...props} />;
}

export type DialogTriggerProps = BaseTriggerProps;

/** Opens the dialog. Pass `render={<Button />}` for a kit button. */
export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger(props, ref) {
    return <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" {...props} />;
  },
);

export type DialogCloseProps = BaseCloseProps;

/** Closes the dialog. Pass `render={<Button />}` for a kit button. */
export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose(props, ref) {
    return <DialogPrimitive.Close ref={ref} data-slot="dialog-close" {...props} />;
  },
);

const dialogContentVariants = cva("i258-dialog", {
  variants: {
    size: {
      sm: "i258-dialog--sm",
      md: "i258-dialog--md",
      lg: "i258-dialog--lg",
    },
  },
  defaultVariants: { size: "md" },
});

export type DialogContentProps = Omit<DialogPopupProps, "className"> &
  VariantProps<typeof dialogContentVariants> & {
    className?: string | undefined;
    /**
     * Render the corner close button. Default true: a modal needs a Close
     * inside it so touch screen-reader users can get out. Turn it off only
     * when the content has its own visible close or cancel button.
     */
    closeButton?: boolean | undefined;
    /** The corner close button's name. Default "Close". */
    closeLabel?: string | undefined;
    /**
     * Where the dialog portals to. Default: the enclosing AppFrame's layer
     * (so it inherits the frame's theme and density), else `document.body`.
     */
    container?: HTMLElement | null | undefined;
  };

/**
 * Backdrop + popup, portalled. Give it a `DialogTitle` (or `aria-label`);
 * Base UI wires the title and description to the popup.
 */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { className, size, closeButton = true, closeLabel = "Close", container, children, ...props },
    ref,
  ) {
    const frameLayer = useFrameLayer();
    return (
      <DialogPrimitive.Portal container={container ?? frameLayer}>
        <DialogPrimitive.Backdrop className="i258-dialog__backdrop" />
        <DialogPrimitive.Popup
          ref={ref}
          data-slot="dialog"
          className={cn(dialogContentVariants({ size }), className)}
          {...props}
        >
          <div className="i258-dialog__inner">{children}</div>
          {closeButton ? (
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="i258-dialog__close"
                  aria-label={closeLabel}
                />
              }
            >
              <CloseIcon />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    );
  },
);

export type DialogTitleProps = Omit<BaseTitleProps, "className"> & {
  className?: string | undefined;
};

/** The dialog's name (an `h2`). */
export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Title ref={ref} className={cn("i258-dialog__title", className)} {...props} />
    );
  },
);

export type DialogDescriptionProps = Omit<BaseDescriptionProps, "className"> & {
  className?: string | undefined;
};

/** Read with the title when the dialog opens. */
export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Description
        ref={ref}
        className={cn("i258-dialog__description", className)}
        {...props}
      />
    );
  },
);

export type DialogBodyProps = React.ComponentProps<"div">;

/** The scrolling middle, between the title and the footer. */
export function DialogBody({ className, ...props }: DialogBodyProps) {
  return <div className={cn("i258-dialog__body", className)} {...props} />;
}

export type DialogFooterProps = React.ComponentProps<"div">;

/** Actions, end-aligned. Put the confirming action last. */
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={cn("i258-dialog__footer", className)} {...props} />;
}

export { dialogContentVariants };
