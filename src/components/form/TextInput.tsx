"use client";

import { forwardRef } from "react";

export type MessageType = "info" | "success" | "warning" | "error";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isOperator?: boolean;
  message?: string;
  messageType?: MessageType;
}

export const getMessageColor = (type: MessageType) => {
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

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      type = "text",
      placeholder,
      isOperator = false,
      message,
      messageType = "error",
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const borderClass = message ? getMessageColor(messageType) : "";

    return (
      <fieldset className="flex flex-col w-full">
        <div
          className={`relative w-full 
        rounded-md bg-slate-50 
        transition-all duration-200  ${
          !isOperator ? " border-2 border-gray-200" : ""
        } ${borderClass} ${className ?? ""} ${
          message ? "border-red-500" : "focus-within:border-(--secondary-color)"
        }
            focus-within:ring-0
            focus-within:bg-white
            focus-within:border-2
          `}
        >
          <input
            id={id}
            type={type}
            placeholder={label}
            autoComplete="new-password"
            aria-invalid={message ? "true" : "false"}
            aria-describedby={message ? `${id}-message` : undefined}
            className={`block p-4 w-full text-xl text-black bg-white autofill:bg-inherit! active:bg-transparent! placeholder-transparent rounded-lg border-0 focus:outline-none peer ${
              disabled ? "bg-gray-100!" : ""
            }`}
            style={{ fontStyle: "normal", fontWeight: 400 }}
            disabled={disabled}
            ref={ref}
            {...rest}
          />
          {label && (
            <label
              htmlFor={id}
              className={`absolute -top-2.5 bg-white left-3 text-gray-500 duration-100 transform text-[13px] px-2 ${
                !placeholder &&
                "peer-placeholder-shown:top-5 peer-focus:-top-2.5  peer-focus:px-2"
              } ${!message ? "peer-focus:text-(--secondary-color)" : ""} ${
                message ? borderClass : ""
              }`}
            >
              {label}
            </label>
          )}
        </div>
        {message && (
          <p
            id={`${id}-message`}
            className={`mt-1 text-xs ${getMessageColor(messageType)}`}
            role="alert"
          >
            {message}
          </p>
        )}
      </fieldset>
    );
  },
);

TextInput.displayName = "TextInput";

export { TextInput };
