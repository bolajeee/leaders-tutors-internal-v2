"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/** Single-digit boxes with paste, backspace and arrow-key support. */
export function OtpInput({ value, onChange, length = 6, disabled, invalid, describedBy }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const focus = (index: number) => refs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div role="group" aria-label="Verification code" className="flex w-full justify-between gap-2 sm:gap-4">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, "").slice(-1);
            setDigit(index, typed);
            if (typed) focus(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit) {
              event.preventDefault();
              setDigit(Math.max(index - 1, 0), "");
              focus(index - 1);
            } else if (event.key === "ArrowLeft") {
              focus(index - 1);
            } else if (event.key === "ArrowRight") {
              focus(index + 1);
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) return;
            event.preventDefault();
            onChange(pasted);
            focus(pasted.length);
          }}
          className={`h-12 w-full min-w-0 max-w-14 rounded-md border bg-white text-center text-xl font-medium text-(--primary-color) focus:border-(--secondary-color) focus:shadow-lg focus:outline-none sm:h-14 ${
            invalid ? "border-red-500" : "border-black/30"
          }`}
        />
      ))}
    </div>
  );
}
