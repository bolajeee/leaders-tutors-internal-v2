import React from "react";

interface InfoIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export const DirectionIcon: React.FC<InfoIconProps> = ({
  width = 21,
  height = 20,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.78509 5.1178C8.08628 2.81661 9.23687 1.66602 10.6666 1.66602C12.0964 1.66602 13.247 2.81661 15.5482 5.1178C17.8494 7.41898 19 8.56958 19 9.99935C19 11.4291 17.8494 12.5797 15.5482 14.8809C13.247 17.1821 12.0964 18.3327 10.6666 18.3327C9.23687 18.3327 8.08628 17.1821 5.78509 14.8809C3.48391 12.5797 2.33331 11.4291 2.33331 9.99935C2.33331 8.56958 3.48391 7.41898 5.78509 5.1178Z"
        stroke="#107C10"
        strokeWidth="1.5"
      />
      <path
        d="M14 9.58333L11.7778 7.5M14 9.58333L11.7778 11.6667M14 9.58333L9.55554 9.58333C8.81479 9.58333 7.33331 10 7.33331 11.6667"
        stroke="#107C10"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
