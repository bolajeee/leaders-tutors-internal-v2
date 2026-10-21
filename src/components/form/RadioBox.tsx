"use client";
import React from "react";

interface RadioProps {
  id: string;
  name: string; // Name is required for radio buttons to work in groups
  disabled?: boolean;
  checked?: boolean; // Boolean value to control the radio button
  value: string; // Value for the radio button
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Event handler
}

const Radio: React.FC<RadioProps> = ({
  id,
  name,
  disabled,
  checked,
  value,
  onChange,
}) => {
  return (
    <label className="radio-container" htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={name} // Ensure radios in the same group share the same name
        disabled={disabled}
        checked={checked}
        value={value}
        onChange={onChange}
      />
      <span className="radiomark"></span>
      {""}
    </label>
  );
};

export { Radio };
