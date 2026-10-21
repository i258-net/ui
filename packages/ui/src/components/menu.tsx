import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type {
  MenuCheckboxItemProps as BaseCheckboxItemProps,
  MenuGroupLabelProps as BaseGroupLabelProps,
  MenuGroupProps as BaseGroupProps,
  MenuItemProps as BaseItemProps,
  MenuLinkItemProps as BaseLinkItemProps,
  MenuPopupProps,
  MenuPositionerProps,
  MenuRadioGroupProps as BaseRadioGroupProps,
  MenuRadioItemProps as BaseRadioItemProps,
  MenuRootProps,
  MenuTriggerProps as BaseTriggerProps,
} from "@base-ui/react/menu";

import { useFrameLayer } from "../lib/frame-context.js";
import { CheckIcon } from "../lib/icons.js";
import { cn } from "../lib/utils.js";

/*
  Menu: a button that opens a list of actions (WAI-ARIA menu button).
  Base UI owns the behaviour: ↑/↓ and Home/End move, typing a letter jumps
  to the item that starts with it, Enter/Space run the item, Escape closes
  and returns focus to the trigger. Items are actions or options — for
  navigation between pages use links, not a menu, unless it's a short list
  of destinations off a button (MenuLinkItem).
*/

export type MenuProps = MenuRootProps;

export function Menu(props: MenuProps) {
  return <MenuPrimitive.Root {...props} />;
}

export type MenuTriggerProps = BaseTriggerProps;

/** Opens the menu. Pass `render={<Button />}` for a kit button. */
export const MenuTrigger = React.forwardRef<HTMLButtonElement, MenuTriggerProps>(
  function MenuTrigger(props, ref) {
    return <MenuPrimitive.Trigger ref={ref} data-slot="menu-trigger" {...props} />;
  },
);

export type MenuContentProps = Omit<MenuPopupProps, "className"> & {
  className?: string | undefined;
  side?: MenuPositionerProps["side"];
  align?: MenuPositionerProps["align"];
  /** Gap between the trigger and the menu, px. Default 6. */
  sideOffset?: number | undefined;
  /**
   * Where the menu portals to. Default: the enclosing AppFrame's layer (so
   * it inherits the frame's theme and density), else `document.body`.
   */
  container?: HTMLElement | null | undefined;
};

/** Portal + positioner + popup. */
export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(
  function MenuContent(
    { className, side = "bottom", align = "start", sideOffset = 6, container, ...props },
    ref,
  ) {
    const frameLayer = useFrameLayer();
    return (
      <MenuPrimitive.Portal container={container ?? frameLayer}>
        <MenuPrimitive.Positioner
          className="i258-menu__positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <MenuPrimitive.Popup
            ref={ref}
            data-slot="menu"
            className={cn("i258-menu", className)}
            {...props}
          />
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    );
  },
);

type ItemExtras = {
  /** Leading glyph. Decorative: the label names the item. */
  icon?: React.ReactNode | undefined;
  /**
   * End-aligned hint: a count or a `Kbd`. Hidden from the item's name, so
   * pass a shortcut's binding in `aria-keyshortcuts` too.
   */
  trailing?: React.ReactNode | undefined;
};

function ItemBody({ icon, trailing, children }: ItemExtras & { children: React.ReactNode }) {
  return (
    <>
      {icon != null ? (
        <span className="i258-menu__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="i258-menu__label">{children}</span>
      {trailing != null ? (
        <span className="i258-menu__trailing" aria-hidden="true">
          {trailing}
        </span>
      ) : null}
    </>
  );
}

export type MenuItemProps = Omit<BaseItemProps, "className" | "children"> &
  ItemExtras & { className?: string | undefined; children?: React.ReactNode };

/** An action. Closes the menu when chosen. */
export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { className, icon, trailing, children, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      data-slot="menu-item"
      className={cn("i258-menu__item", className)}
      {...props}
    >
      <ItemBody icon={icon} trailing={trailing}>
        {children}
      </ItemBody>
    </MenuPrimitive.Item>
  );
});

export type MenuLinkItemProps = Omit<BaseLinkItemProps, "className" | "children"> &
  ItemExtras & { className?: string | undefined; children?: React.ReactNode };

/** A destination (`<a>`). Pass `render` for a router link. */
export const MenuLinkItem = React.forwardRef<HTMLAnchorElement, MenuLinkItemProps>(
  function MenuLinkItem(
    { className, icon, trailing, children, closeOnClick = true, ...props },
    ref,
  ) {
    return (
      <MenuPrimitive.LinkItem
        ref={ref}
        data-slot="menu-item"
        className={cn("i258-menu__item", className)}
        closeOnClick={closeOnClick}
        {...props}
      >
        <ItemBody icon={icon} trailing={trailing}>
          {children}
        </ItemBody>
      </MenuPrimitive.LinkItem>
    );
  },
);

export type MenuCheckboxItemProps = Omit<BaseCheckboxItemProps, "className" | "children"> &
  Pick<ItemExtras, "trailing"> & { className?: string | undefined; children?: React.ReactNode };

/**
 * An on/off option (`menuitemcheckbox`). Stays open when chosen, by
 * default, so several can be toggled in one visit (filter menus).
 */
export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem({ className, trailing, children, closeOnClick = false, ...props }, ref) {
    return (
      <MenuPrimitive.CheckboxItem
        ref={ref}
        data-slot="menu-checkbox-item"
        className={cn("i258-menu__item i258-menu__item--option", className)}
        closeOnClick={closeOnClick}
        {...props}
      >
        <span className="i258-menu__check" aria-hidden="true">
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon />
          </MenuPrimitive.CheckboxItemIndicator>
        </span>
        <ItemBody trailing={trailing}>{children}</ItemBody>
      </MenuPrimitive.CheckboxItem>
    );
  },
);

export type MenuRadioGroupProps = BaseRadioGroupProps;

/** One-of-many options. Give it `value` / `onValueChange`. */
export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup(props, ref) {
    return <MenuPrimitive.RadioGroup ref={ref} {...props} />;
  },
);

export type MenuRadioItemProps = Omit<BaseRadioItemProps, "className" | "children"> &
  Pick<ItemExtras, "trailing"> & { className?: string | undefined; children?: React.ReactNode };

/** One option in a MenuRadioGroup (`menuitemradio`). Stays open when chosen. */
export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem({ className, trailing, children, ...props }, ref) {
    return (
      <MenuPrimitive.RadioItem
        ref={ref}
        data-slot="menu-radio-item"
        className={cn("i258-menu__item i258-menu__item--option", className)}
        {...props}
      >
        <span className="i258-menu__check i258-menu__check--radio" aria-hidden="true">
          <MenuPrimitive.RadioItemIndicator className="i258-menu__dot" />
        </span>
        <ItemBody trailing={trailing}>{children}</ItemBody>
      </MenuPrimitive.RadioItem>
    );
  },
);

export function MenuSeparator({ className }: { className?: string | undefined }) {
  return <MenuPrimitive.Separator className={cn("i258-menu__separator", className)} />;
}

export type MenuGroupProps = BaseGroupProps;

/** Groups items under a MenuGroupLabel. */
export const MenuGroup = React.forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(
  props,
  ref,
) {
  return <MenuPrimitive.Group ref={ref} {...props} />;
});

export type MenuGroupLabelProps = Omit<BaseGroupLabelProps, "className"> & {
  className?: string | undefined;
};

export const MenuGroupLabel = React.forwardRef<HTMLDivElement, MenuGroupLabelProps>(
  function MenuGroupLabel({ className, ...props }, ref) {
    return (
      <MenuPrimitive.GroupLabel
        ref={ref}
        className={cn("i258-menu__group-label", className)}
        {...props}
      />
    );
  },
);
