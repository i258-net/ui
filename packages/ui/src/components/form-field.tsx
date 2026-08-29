import * as React from "react";

import { cn } from "../lib/utils.js";
import { Checkbox } from "./checkbox.js";
import { Label } from "./label.js";

function mergeIds(
  ...parts: Array<string | undefined | null | false>
): string | undefined {
  const ids = parts
    .flatMap((part) => (typeof part === "string" ? part.split(/\s+/) : []))
    .filter(Boolean);
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
}

export type FormFieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Visible label text/node. */
  label: React.ReactNode;
  /** Optional hint below the control; wired into `aria-describedby`. */
  description?: React.ReactNode;
  /** Optional error below the control; sets `aria-invalid` + `aria-describedby`. */
  error?: React.ReactNode;
  /**
   * `vertical` — label above control (Input / Textarea).
   * `horizontal` — control beside label (Checkbox).
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Stable control id. When omitted, FormField generates one with `useId`.
   * A child `id` prop wins over this.
   */
  id?: string;
  /** Single control element — FormField injects id / aria wiring. */
  children: React.ReactElement;
};

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(
    {
      className,
      label,
      description,
      error,
      orientation = "vertical",
      id: idProp,
      children,
      ...props
    },
    ref,
  ) {
    const generatedId = React.useId();
    const child = React.Children.only(children) as React.ReactElement<{
      id?: string;
      disabled?: boolean;
      "aria-describedby"?: string;
      "aria-labelledby"?: string;
      "aria-invalid"?: boolean | "true" | "false";
    }>;

    const controlId = child.props.id ?? idProp ?? generatedId;
    const labelId = `${controlId}-label`;
    const descriptionId =
      description != null ? `${controlId}-description` : undefined;
    const hasError = error != null;
    const errorId = hasError ? `${controlId}-error` : undefined;
    const describedBy = mergeIds(descriptionId, errorId);

    // Base UI Checkbox is not a labelable native control — htmlFor alone does
    // not name it. Always pair with aria-labelledby for Checkbox (and for
    // horizontal layouts generally).
    const needsLabelledBy =
      orientation === "horizontal" || child.type === Checkbox;

    const nextDescribedBy = mergeIds(
      child.props["aria-describedby"],
      describedBy,
    );
    const nextLabelledBy = needsLabelledBy
      ? mergeIds(child.props["aria-labelledby"], labelId)
      : undefined;

    const control = React.cloneElement(child, {
      id: controlId,
      ...(nextDescribedBy != null
        ? { "aria-describedby": nextDescribedBy }
        : {}),
      ...(hasError
        ? { "aria-invalid": child.props["aria-invalid"] ?? true }
        : {}),
      ...(nextLabelledBy != null
        ? { "aria-labelledby": nextLabelledBy }
        : {}),
    });

    const labelEl = (
      <Label
        id={labelId}
        htmlFor={controlId}
        data-disabled={child.props.disabled ? "" : undefined}
      >
        {label}
      </Label>
    );

    const descriptionEl =
      descriptionId != null ? (
        <div
          id={descriptionId}
          data-slot="form-field-description"
          className="i258-form-field__description"
        >
          {description}
        </div>
      ) : null;

    const errorEl =
      errorId != null ? (
        <div
          id={errorId}
          data-slot="form-field-error"
          className="i258-form-field__error"
          role="alert"
        >
          {error}
        </div>
      ) : null;

    return (
      <div
        ref={ref}
        data-slot="form-field"
        data-orientation={orientation}
        className={cn(
          "i258-form-field",
          orientation === "horizontal" && "i258-form-field--horizontal",
          className,
        )}
        {...props}
      >
        {orientation === "horizontal" ? (
          <>
            {control}
            <div data-slot="form-field-copy" className="i258-form-field__copy">
              {labelEl}
              {descriptionEl}
              {errorEl}
            </div>
          </>
        ) : (
          <>
            {labelEl}
            {control}
            {descriptionEl}
            {errorEl}
          </>
        )}
      </div>
    );
  },
);
