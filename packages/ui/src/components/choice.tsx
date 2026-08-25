import * as React from "react";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { ToggleGroupProps } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import type { ToggleProps } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils.js";

const choiceGroupVariants = cva("i258-choice-group", {
  variants: {
    orientation: {
      horizontal: "i258-choice-group--horizontal",
      vertical: "i258-choice-group--vertical",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type ChoiceGroupProps<Value extends string = string> =
  ToggleGroupProps<Value> &
    VariantProps<typeof choiceGroupVariants>;

export function ChoiceGroup<Value extends string = string>({
  className,
  orientation = "horizontal",
  ...props
}: ChoiceGroupProps<Value>) {
  return (
    <ToggleGroup
      data-slot="choice-group"
      orientation={orientation ?? "horizontal"}
      className={cn(choiceGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

const choiceVariants = cva("i258-choice", {
  variants: {
    variant: {
      chip: "i258-choice--chip",
      option: "i258-choice--option",
    },
    size: {
      sm: "i258-choice--sm",
      md: "i258-choice--md",
    },
  },
  defaultVariants: {
    variant: "chip",
    size: "md",
  },
});

export type ChoiceProps<Value extends string = string> = ToggleProps<Value> &
  VariantProps<typeof choiceVariants> & {
    /** Optional count rendered after the label (chip variant). */
    count?: React.ReactNode;
  };

export function Choice<Value extends string = string>({
  className,
  variant,
  size,
  count,
  children,
  ...props
}: ChoiceProps<Value>) {
  return (
    <Toggle
      data-slot="choice"
      className={cn(choiceVariants({ variant, size }), className)}
      {...props}
    >
      <span className="i258-choice__label">{children}</span>
      {count != null ? (
        <span className="i258-choice__count">{count}</span>
      ) : null}
    </Toggle>
  );
}

export { choiceGroupVariants, choiceVariants };
