"use client";

import {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useRef,
  useCallback,
} from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";

type MessageType = "info" | "success" | "warning" | "error";

type BaseProps<TFieldValues extends FieldValues> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "name"
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

  onInputChange?: (search: string) => void;
  menuPortalTarget?: HTMLElement;
  components?: {
    MenuList?: React.ComponentType<{ height?: number }>;
  };
};

interface Option {
  value: string | number;
  label: string;
  data?: undefined;
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

function FormSelectInner<TFieldValues extends FieldValues>(
  props: FormSelectProps<TFieldValues>,
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
    isLoading = false,
    searchPlaceholder = "Search...",
    className,
    placeholder = "Select...",
    disabled = false,

    onInputChange,
    menuPortalTarget,
    components,
    ...rest
  } = props;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
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

  const updateDropdownPosition = useCallback(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }

      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const stringValue = value != null ? String(value) : "";

        return (
          <div className={`flex flex-col w-full relative`} ref={selectRef}>
            <div
              className={`relative rounded-md bg-slate-50 transition-all duration-200 ${
                !isOperator ? "border-2 border-gray-200" : ""
              } ${error ? getMessageColor("error") : borderClass} ${
                className ?? "w-full"
              }
                  focus-within:border-[var(--secondary-color)] focus-within:ring-0 focus-within:bg-white focus-within:border-2`}
            >
              {label && (
                <label
                  htmlFor={id}
                  className="absolute -top-2 left-3 text-xs text-gray-600 bg-white px-1 z-30"
                >
                  {label}
                </label>
              )}

              <button
                type="button"
                className={`w-full text-left p-4 py-5 text-sm text-black bg-white rounded-lg border-0 focus:outline-none peer flex justify-between items-center ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={
                  !disabled ? () => setIsOpen((prev) => !prev) : undefined
                }
              >
                <span>
                  {options.find((opt) => String(opt.value) === stringValue)
                    ?.label || placeholder}
                </span>
                <div className="flex items-center gap-2">
                  {stringValue && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(""); // reset
                        setQuery("");
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 cursor-pointer"
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
            </div>

            {/* Portal dropdown */}
            {isOpen &&
              createPortal(
                <div
                  style={dropdownStyle}
                  className="bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full p-2 border-b border-gray-200 text-sm outline-none"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      onInputChange?.(e.target.value);
                    }}
                    disabled={isLoading || disabled}
                  />

                  {components?.MenuList ? (
                    <components.MenuList height={240} />
                  ) : (
                    <ul className="max-h-48 overflow-y-auto">
                      {isLoading ? (
                        <li className="p-2 text-gray-500 text-sm flex justify-center items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-color)]" />
                          <span className="text-sm">Loading...</span>
                        </li>
                      ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                          <li
                            key={opt.value}
                            className={`p-2 hover:bg-green-100 text-sm cursor-pointer ${
                              stringValue === String(opt.value)
                                ? "bg-green-50 font-medium"
                                : ""
                            }`}
                            onClick={() => {
                              onChange(String(opt.value));
                              setIsOpen(false);
                              setQuery("");
                            }}
                          >
                            {opt.label}
                          </li>
                        ))
                      ) : (
                        <li className="p-2 text-gray-500 text-sm flex justify-center items-center gap-2">
                          <Search className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">No results found</span>
                        </li>
                      )}
                    </ul>
                  )}
                </div>,
                menuPortalTarget ?? document.body,
              )}

            {(error?.message || message) && (
              <p
                className={`mt-1 text-xs ${
                  error
                    ? getMessageColor("error")
                    : getMessageColor(messageType)
                }`}
              >
                {error?.message || message}
              </p>
            )}

            {/* Hidden select for form compatibility */}
            <select
              id={id}
              ref={ref}
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              className="hidden"
              disabled={disabled}
              {...rest}
            >
              {options.map((opt) => (
                <option key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      }}
    />
  );
}

type FormSelectProps<TFieldValues extends FieldValues> =
  BaseProps<TFieldValues> & {
    options: Option[];
  };

export const CustomCourseraListSelect = forwardRef(FormSelectInner) as <
  TFieldValues extends FieldValues,
>(
  props: FormSelectProps<TFieldValues> & {
    ref?: React.ForwardedRef<HTMLSelectElement>;
  },
) => ReturnType<typeof FormSelectInner>;
