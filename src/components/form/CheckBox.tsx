"use client";
import React from "react";

interface CheckboxProps {
  id?: string;
  name?: string;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  "aria-label"?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  disabled,
  checked,
  value,
  onChange,
  "aria-label": ariaLabel,
}) => {
  return (
    <label className="container" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        name={name}
        disabled={disabled}
        checked={checked}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      <span className="checkmark" aria-hidden="true"></span>
    </label>
  );
};
