"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

type MessageType = "info" | "success" | "warning" | "error";

interface Option {
  value: string;
  label: string;
}

type FormSelectProps<TFieldValues extends FieldValues> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "name" | "size" | "value" | "onChange"
> & {
  id?: string;
  label?: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  options: Option[];
  isLoading?: boolean;
  message?: string;
  messageType?: MessageType;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

const messageColor = (type: MessageType) => {
  switch (type) {
    case "success":
      return "text-green-700";
    case "warning":
      return "text-yellow-800";
    case "info":
      return "text-blue-700";
    default:
      return "text-red-700";
  }
};

/**
 * A labelled native select wired to react-hook-form. A native control gives
 * keyboard operation, screen-reader semantics and a good mobile picker for free.
 */
function FormSelectInner<TFieldValues extends FieldValues>(
  props: FormSelectProps<TFieldValues>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const {
    id,
    label,
    message,
    messageType = "error",
    options = [],
    name,
    control,
    isLoading = false,
    className,
    placeholder = "Select here",
    disabled = false,
    ...rest
  } = props;
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const text = error?.message || message;
        const messageId = `${fieldId}-message`;
        return (
          <div className="relative flex w-full flex-col">
            <div
              className={`relative rounded-md border-2 bg-slate-50 transition-all duration-200 focus-within:border-secondary focus-within:bg-white ${
                text ? "border-red-500" : "border-gray-200"
              } ${className ?? "w-full"}`}
            >
              {label && (
                <label
                  htmlFor={fieldId}
                  className="absolute -top-2.5 left-3 z-10 bg-white px-2 text-[13px] text-gray-600"
                >
                  {label}
                </label>
              )}
              <select
                {...rest}
                id={fieldId}
                ref={(element) => {
                  field.ref(element);
                  if (typeof ref === "function") ref(element);
                  else if (ref) ref.current = element;
                }}
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled || isLoading}
                aria-invalid={text ? "true" : "false"}
                aria-describedby={text ? messageId : undefined}
                className="block w-full appearance-none rounded-lg bg-white p-4 py-5 pr-10 text-sm text-black focus:outline-none disabled:opacity-60"
              >
                <option value="">{isLoading ? "Loading…" : placeholder}</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
                aria-hidden
              />
            </div>
            {text && (
              <p
                id={messageId}
                role="alert"
                className={`mt-1 text-xs ${error ? messageColor("error") : messageColor(messageType)}`}
              >
                {text}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export const FormSelect = forwardRef(FormSelectInner) as <
  TFieldValues extends FieldValues,
>(
  props: FormSelectProps<TFieldValues> & {
    ref?: React.ForwardedRef<HTMLSelectElement>;
  },
) => ReturnType<typeof FormSelectInner>;
