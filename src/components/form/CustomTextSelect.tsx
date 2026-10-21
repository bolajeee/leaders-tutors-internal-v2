"use client";

import { forwardRef } from "react";

type MessageType = "info" | "success" | "warning" | "error";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  isOperator?: boolean;
  message?: string;
  messageType?: MessageType;
  options: { value: string; label: string }[];
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

const CustomTextSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      id,
      label,
      isOperator = false,
      message,
      messageType = "error",
      className,
      options,
      defaultValue = "",
      ...rest
    },
    ref,
  ) => {
    const borderClass = message ? getMessageColor(messageType) : "";

    return (
      <>
        <div
          className={`relative z-0 w-full group 
            rounded-md bg-slate-50 
            transition-all duration-200  ${
              !isOperator ? " border-2 border-gray-200" : ""
            } ${borderClass} ${className ?? ""}
               focus-within:border-mtn-500
                focus-within:ring-0
                focus-within:bg-white
                focus-within:border-2
              `}
        >
          <select
            id={id}
            ref={ref}
            defaultValue={defaultValue}
            className="block p-4 py-5 w-full text-sm text-black bg-white autofill:!bg-inherit active:!bg-transparent placeholder-transparent rounded-lg border-0 focus:outline-none peer appearance-none"
            {...rest}
          >
            <option value="" disabled hidden>
              {label}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {label && (
            <label
              htmlFor={id}
              className={`absolute top-[-10px] bg-white left-3 text-subtitle duration-100 transform text-xs px-2 ${
                !label &&
                "peer-placeholder-shown:top-5 peer-focus:top-[-10px] peer-focus:text-subtitle peer-focus:px-2 peer-focus:text-mtn-500"
              } ${message ? borderClass : ""}`}
            >
              {label}
            </label>
          )}
        </div>
        {message && (
          <p
            className={`relative top-[-10px] text-xs ${getMessageColor(messageType)}`}
          >
            {message}
          </p>
        )}
      </>
    );
  },
);

CustomTextSelect.displayName = "FormSelect";

export { CustomTextSelect };
