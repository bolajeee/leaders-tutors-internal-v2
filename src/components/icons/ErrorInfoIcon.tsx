import React from "react";

interface InfoIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export const ErrorInfoIcon: React.FC<InfoIconProps> = ({
  width = 138,
  height = 137,
  className = "",
  fill = "#EF4444",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 138 137"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        opacity="0.5"
        d="M126.084 68.5001C126.084 100.026 100.527 125.583 69.0003 125.583C37.4741 125.583 11.917 100.026 11.917 68.5001C11.917 36.9738 37.4741 11.4167 69.0003 11.4167C100.527 11.4167 126.084 36.9738 126.084 68.5001Z"
        fill={fill}
      />
      <path
        d="M69.0003 101.323C71.3648 101.323 73.2816 99.4061 73.2816 97.0416V62.7916C73.2816 60.4271 71.3648 58.5103 69.0003 58.5103C66.6359 58.5103 64.7191 60.4271 64.7191 62.7916V97.0416C64.7191 99.4061 66.6359 101.323 69.0003 101.323Z"
        fill={fill}
      />
      <path
        d="M69.0003 39.9583C72.153 39.9583 74.7087 42.514 74.7087 45.6666C74.7087 48.8192 72.153 51.3749 69.0003 51.3749C65.8477 51.3749 63.292 48.8192 63.292 45.6666C63.292 42.514 65.8477 39.9583 69.0003 39.9583Z"
        fill={fill}
      />
    </svg>
  );
};
