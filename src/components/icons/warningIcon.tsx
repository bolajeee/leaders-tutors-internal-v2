import React from "react";

interface WarningIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export const WarningIcon: React.FC<WarningIconProps> = ({
  width = 38,
  height = 38,
  className = "",
  fill = "#FACC15", // default yellow (Tailwind's yellow-400)
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M19 2L36 34H2L19 2Z" stroke={fill} strokeWidth="2" fill="none" />
      <path
        d="M19 14V22"
        stroke={fill}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="19" cy="28" r="1.8" fill={fill} />
    </svg>
  );
};
