import React from "react";

interface InfoIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({
  width = 38,
  height = 38,
  className = "",
  fill = "#92CFF5",
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
      <path
        d="M19.0003 0.666504C8.88033 0.666504 0.666992 8.87984 0.666992 18.9998C0.666992 29.1198 8.88033 37.3332 19.0003 37.3332C29.1203 37.3332 37.3337 29.1198 37.3337 18.9998C37.3337 8.87984 29.1203 0.666504 19.0003 0.666504ZM20.8337 28.1665H17.167V17.1665H20.8337V28.1665ZM20.8337 13.4998H17.167V9.83317H20.8337V13.4998Z"
        fill={fill}
      />
    </svg>
  );
};
