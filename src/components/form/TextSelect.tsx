"use client";

import { useClickOutside } from "@/hooks/useClickOutside";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useState, useMemo, useEffect, forwardRef, useRef } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

type MessageType = "info" | "success" | "warning" | "error";

type BaseProps<TFieldValues extends FieldValues> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "name" | "size"
> & {
  id?: string;
  label?: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  isLoading?: boolean;
  searchPlaceholder?: string;
  isOperator?: boolean;
  message?: string;
  messageType?: MessageType;
  zindex?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  clearable?: boolean;
};

interface OptionWithoutData {
  value: string;
  label: string;
  data?: never;
}
interface OptionWithData<T> {
  value: string;
  label: string;
  data: T;
}

interface PropsWithRender<
  TFieldValues extends FieldValues,
  TOption,
> extends BaseProps<TFieldValues> {
  renderOption: (opt: TOption, isSelected: boolean) => React.ReactNode;
  options: OptionWithData<TOption>[];
  getOptionLabel?: never;
  getOptionValue?: never;
}
interface PropsWithoutRender<
  TFieldValues extends FieldValues,
> extends BaseProps<TFieldValues> {
  renderOption?: undefined;
  options: OptionWithoutData[];
  getOptionLabel?: (opt: OptionWithoutData) => string;
  getOptionValue?: (opt: OptionWithoutData) => string;
}

const getMessageColor = (type: MessageType) => {
  switch (type) {
    case "success":
      return "text-green-600 border-green-500";
    case "warning":
      return "text-yellow-600 border-yellow-500";
    case "error":
      return "text-red-600 border-red-500";
    case "info":
      return "text-blue-600 border-blue-500";
    default:
      return "text-gray-500 border-black/10";
  }
};

function FormSelectInner<TFieldValues extends FieldValues, TOption = unknown>(
  props: FormSelectProps<TFieldValues, TOption>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const {
    id,
    label,
    isOperator = false,
    message,
    messageType = "error",
    options = [],
    name,
    control,
    renderOption,
    isLoading = false,
    searchPlaceholder = "Search...",
    className,
    placeholder,
    disabled = false,
    size = "md",
    clearable = true,
    ...rest
  } = props;
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  useClickOutside(selectRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false),
  );

  const borderClass = message ? getMessageColor(messageType) : "";

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      (opt.label ?? "").toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, options]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className={`flex flex-col w-full relative`} ref={selectRef}>
          <div
            className={`relative rounded-md bg-slate-50 transition-all duration-200 ${
              !isOperator ? "border-2 border-gray-200" : ""
            } ${error ? getMessageColor("error") : borderClass} ${className ?? "w-full"}
                focus-within:border-mtn-500 focus-within:ring-0 focus-within:bg-white focus-within:border-2`}
          >
            <label
              htmlFor={id}
              className="absolute -top-2 left-3 text-xs text-gray-600 bg-white px-1 z-30"
            >
              {label}
            </label>

            <button
              type="button"
              className={`w-full text-left ${size === "sm" ? "p-3 py-3 text-sm" : "p-4 py-5 text-sm"} text-black bg-white rounded-lg border-0 focus:outline-none peer flex justify-between items-center ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={!disabled ? () => setIsOpen((prev) => !prev) : undefined}
            >
              <span>
                {options.find((opt) => opt.value === value)?.label ||
                  placeholder}
              </span>
              <div className="flex items-center gap-2">
                {clearable && value && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange("");
                      setQuery("");
                    }}
                    className={`${size === "sm" ? "p-1" : "p-1"} hover:bg-gray-100 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mtn-500 focus:ring-offset-2`}
                    title="Clear selection"
                    aria-label="Clear selection"
                  >
                    <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                  </div>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </div>
            </button>

            {isOpen && (
              <div
                className={`absolute z-50 top-full left-0 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  className={`w-full ${size === "sm" ? "p-2 text-xs" : "p-2 text-sm"} border-b border-gray-200 outline-none`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading || disabled}
                />
                <ul className="max-h-48 overflow-y-auto ">
                  {isLoading ? (
                    <li className="p-2 text-gray-500 text-sm flex justify-center items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-mtn-500" />
                      <span className="text-sm">Loading...</span>
                    </li>
                  ) : filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                      <li
                        key={opt.value}
                        className={`p-2 hover:bg-mtn-100 ${size === "sm" ? "text-xs" : "text-sm"} px-3 cursor-pointer ${
                          value === opt.value ? "bg-mtn-50 font-medium" : ""
                        }`}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setQuery("");
                        }}
                      >
                        {renderOption && opt.data
                          ? renderOption(opt.data, value === opt.value)
                          : opt.label}
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-gray-500 text-sm flex justify-center items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">No results found</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {(error?.message || message) && (
            <p
              className={`mt-1 text-xs ${error ? getMessageColor("error") : getMessageColor(messageType)}`}
            >
              {error?.message || message}
            </p>
          )}

          <select
            id={id}
            ref={ref}
            value={value}
            onChange={onChange}
            className="hidden"
            disabled={disabled}
            {...rest}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    />
  );
}

type FormSelectProps<TFieldValues extends FieldValues, TOption = unknown> =
  | PropsWithRender<TFieldValues, TOption>
  | PropsWithoutRender<TFieldValues>;

export const FormSelect = forwardRef(FormSelectInner) as <
  TFieldValues extends FieldValues,
  TOption = unknown,
>(
  props: FormSelectProps<TFieldValues, TOption> & {
    ref?: React.ForwardedRef<HTMLSelectElement>;
  },
) => ReturnType<typeof FormSelectInner>;
