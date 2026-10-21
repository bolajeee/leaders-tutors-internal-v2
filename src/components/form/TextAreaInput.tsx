"use client";

import { forwardRef } from "react";

type MessageType = "info" | "success" | "warning" | "error";

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  isOperator?: boolean;
  message?: string;
  messageType?: MessageType;
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

const TextAreaInput = forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  (
    {
      id,
      label,
      placeholder,
      isOperator = false,
      message,
      messageType = "error",
      className,
      rows = 2,
      ...rest
    },
    ref,
  ) => {
    const borderClass = message ? getMessageColor(messageType) : "";

    return (
      <div>
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
          <textarea
            id={id}
            placeholder={label}
            autoComplete="off"
            className="block p-4 w-full text-xl text-black bg-white autofill:!bg-inherit active:!bg-transparent placeholder-transparent rounded-lg border-0 focus:outline-none peer"
            style={{ fontStyle: "normal", fontWeight: 400 }}
            ref={ref}
            rows={rows}
            {...rest}
          />
          {label && (
            <label
              htmlFor={id}
              className={`absolute top-[-10px] bg-white left-3 text-subtitle duration-100 transform text-xs px-2 ${
                !placeholder &&
                "peer-placeholder-shown:top-5 peer-focus:top-[-10px] peer-focus:text-subtitle peer-focus:px-2 peer-focus:text-mtn-500"
              } ${message ? borderClass : ""}`}
            >
              {label}
            </label>
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

TextAreaInput.displayName = "TextAreaInput";

export { TextAreaInput };
