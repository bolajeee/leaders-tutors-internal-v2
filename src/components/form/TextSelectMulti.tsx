"use client";

import { XIcon } from "lucide-react";
import { forwardRef, useState } from "react";

type MessageType = "info" | "success" | "warning" | "error";

interface FormMultiSelectProps {
  label?: string;
  message?: string;
  messageType?: MessageType;
  options: { value: string; label: string }[];
  value: string[];
  onChange?: (selected: string[]) => void;
  id?: string;
  className?: string;
  maxSelected?: number;
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

const FormMultiSelect = forwardRef<HTMLInputElement, FormMultiSelectProps>(
  (
    {
      id,
      label,
      message,
      messageType = "error",
      className,
      options,
      value,
      onChange,
      maxSelected,
    },
    ref,
  ) => {
    const [search, setSearch] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const borderClass = message ? getMessageColor(messageType) : "";

    const handleRemove = (val: string) => {
      onChange?.(value.filter((v) => v !== val));
    };

    const availableOptions = options.filter(
      (opt) =>
        !value.includes(opt.value) &&
        opt?.label?.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSelect = (val: string) => {
      if (
        !value.includes(val) &&
        (!maxSelected || value.length < maxSelected)
      ) {
        onChange?.([...value, val]);
        setSearch("");
        setIsFocused(false);
      }
    };

    return (
      <div className="flex flex-col w-full">
        <div
          className={`relative w-full group border-2 rounded-md bg-slate-50
          transition-all duration-200 ${borderClass} ${className ?? ""}
          focus-within:border-mtn-500`}
        >
          {label && (
            <label
              htmlFor={id}
              className="absolute px-2 bg-white ml-4 mt-[-10px] text-xs font-medium text-gray-700"
            >
              {label}
            </label>
          )}

          {/* Pills */}
          <div className="flex flex-wrap items-center gap-1 p-2">
            {value.map((v, index) => {
              const opt = options.find((o) => o.value === v);
              return (
                <span
                  key={`${v}-${index}`}
                  className="flex items-center px-2 py-0.5 rounded-full bg-gray-200 text-xs"
                >
                  {opt?.label ?? v}
                  <button
                    type="button"
                    onClick={() => handleRemove(v)}
                    className="ml-1 focus:outline-none"
                  >
                    <XIcon size={12} />
                  </button>
                </span>
              );
            })}
            <input
              id={id}
              ref={ref}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm p-3 placeholder:text-gray-500"
              placeholder={
                maxSelected && value.length >= maxSelected
                  ? `Max ${maxSelected} reached`
                  : "Search..."
              }
              disabled={!!maxSelected && value.length >= maxSelected}
            />
          </div>

          {/* Dropdown */}
          {isFocused && availableOptions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-40 overflow-auto">
              {availableOptions.map((opt) => (
                <li
                  key={opt.value}
                  onMouseDown={() => handleSelect(opt.value)}
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    maxSelected && value.length >= maxSelected
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {message && (
          <p className={`mt-1 text-xs ${getMessageColor(messageType)}`}>
            {message}
          </p>
        )}
      </div>
    );
  },
);

FormMultiSelect.displayName = "FormMultiSelect";
export { FormMultiSelect };
