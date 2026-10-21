"use client";

import { format } from "date-fns";
import { forwardRef, useState, useRef, useEffect } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { getMessageColor, MessageType } from "./TextInput";
import "react-day-picker/dist/style.css";

interface DateRangeInputProps {
  id: string;
  label?: string;
  message?: string;
  messageType?: MessageType;
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
}

const DateRangeInput = forwardRef<HTMLFieldSetElement, DateRangeInputProps>(
  (
    { id, label, message, messageType = "error", className, value, onChange },
    ref,
  ) => {
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
      value,
    );
    const [showCalendar, setShowCalendar] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleSelect = (range: DateRange | undefined) => {
      setSelectedRange(range);

      // Only close calendar and trigger change if both from and to are set
      if (range?.from && range?.to) {
        // If user selects same date, don't accept it
        if (range.from.getTime() === range.to.getTime()) {
          return;
        }

        onChange?.(range);
        setShowCalendar(false);
      }
    };

    const clearSelection = () => {
      setSelectedRange(undefined);
      onChange?.(undefined);
    };

    const formatted =
      selectedRange?.from && selectedRange?.to
        ? `${format(selectedRange.from, "dd MMM yyyy")} → ${format(selectedRange.to, "dd MMM yyyy")}`
        : "";

    const borderClass = message ? getMessageColor(messageType) : "";

    // Close calendar on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          setShowCalendar(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <fieldset className="flex flex-col w-full" ref={ref}>
        {label && <legend className="sr-only">{label}</legend>}
        <div
          className={`relative z-0 w-full rounded-md bg-slate-50 transition-all duration-200 
            border-2 border-gray-200 focus-within:bg-white focus-within:border-2 focus-within:ring-0
            ${borderClass} ${className ?? ""} ${message ? "border-red-500" : "focus-within:border-mtn-500"}
          `}
        >
          <input
            id={id}
            readOnly
            value={formatted}
            placeholder={label}
            autoComplete="off"
            aria-invalid={!!message}
            aria-describedby={message ? `${id}-message` : undefined}
            className="block p-4 w-full text-xl text-black bg-white placeholder-transparent rounded-lg border-0 focus:outline-none peer"
            onClick={() => setShowCalendar((prev) => !prev)}
          />
          {label && (
            <label
              htmlFor={id}
              className={`absolute top-[-10px] bg-white left-3 text-subtitle duration-100 transform text-xs px-2
                peer-placeholder-shown:top-5 peer-focus:top-[-10px] peer-focus:text-subtitle peer-focus:px-2
                ${!message ? "peer-focus:text-mtn-500" : ""} ${message ? borderClass : ""}`}
            >
              {label}
            </label>
          )}
        </div>

        {showCalendar && (
          <div
            className="mt-2 p-4 bg-white shadow border rounded-lg w-full max-w-fit"
            ref={wrapperRef}
          >
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={
                typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2
              }
              className="w-full"
              classNames={{
                months: "flex flex-row gap-4", // This is key!
              }}
            />
            {(selectedRange?.from || selectedRange?.to) && (
              <button
                type="button"
                onClick={clearSelection}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Clear Date Range
              </button>
            )}
          </div>
        )}

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

DateRangeInput.displayName = "DateRangeInput";
export { DateRangeInput };
