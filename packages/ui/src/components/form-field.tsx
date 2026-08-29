import * as React from "react";
import { Field } from "@base-ui/react/field";

import { cn } from "../lib/utils.js";
import { Checkbox } from "./checkbox.js";

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
   * Stable control id. When omitted, Base UI Field generates one.
   * A child `id` prop wins over this. For Checkbox, prefer `id` on the child
   * (Checkbox is Field-aware and is not wrapped in `Field.Control`).
   */
  id?: string;
  /** Single control element — FormField owns label/description/error wiring. */
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
    const child = React.Children.only(children) as React.ReactElement<{
      id?: string;
      disabled?: boolean;
    }>;

    const hasError = error != null;
    const controlId = child.props.id ?? idProp;
    const disabled = child.props.disabled === true;
    // Base UI Checkbox already reads Field context (labelId → aria-labelledby).
    // Native Input/Textarea are not Field-aware — Field.Control registers them.
    const isFieldAware = child.type === Checkbox;

    const control = isFieldAware ? (
      child
    ) : (
      <Field.Control id={controlId} disabled={disabled} render={child} />
    );

    const labelEl = (
      <Field.Label className="i258-label" data-slot="label">
        {label}
      </Field.Label>
    );

    const descriptionEl =
      description != null ? (
        <Field.Description
          data-slot="form-field-description"
          className="i258-form-field__description"
        >
          {description}
        </Field.Description>
      ) : null;

    const errorEl = hasError ? (
      <Field.Error
        match
        data-slot="form-field-error"
        className="i258-form-field__error"
        role="alert"
      >
        {error}
      </Field.Error>
    ) : null;

    return (
      <Field.Root
        ref={ref}
        data-slot="form-field"
        data-orientation={orientation}
        invalid={hasError || undefined}
        disabled={disabled || undefined}
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
      </Field.Root>
    );
  },
);
