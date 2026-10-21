"use client";

import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput } from "./TextInput";

type PasswordInputProps = Omit<ComponentProps<typeof TextInput>, "type">;

/** A password field with an accessible show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ id, label, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative w-full">
        <TextInput
          ref={ref}
          id={id}
          label={label}
          type={visible ? "text" : "password"}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={`${visible ? "Hide" : "Show"} ${label?.toLowerCase() ?? "password"}`}
          className="absolute right-2 top-[30px] -translate-y-1/2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
