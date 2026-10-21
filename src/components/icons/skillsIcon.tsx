import React from "react";

interface SkillsIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export const SkillsIcon: React.FC<SkillsIconProps> = ({
  width = 38,
  height = 38,
  className = "",
  fill = "#107C10",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M18.3333 6.89167V3.52501C18.3333 2.20001 17.8 1.66667 16.475 1.66667H13.1083C11.7833 1.66667 11.25 2.20001 11.25 3.52501V6.89167C11.25 8.21667 11.7833 8.75001 13.1083 8.75001H16.475C17.8 8.75001 18.3333 8.21667 18.3333 6.89167Z"
        stroke={fill}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.74996 7.10001V3.31667C8.74996 2.14167 8.21663 1.66667 6.89163 1.66667H3.52496C2.19996 1.66667 1.66663 2.14167 1.66663 3.31667V7.09167C1.66663 8.27501 2.19996 8.74167 3.52496 8.74167H6.89163C8.21663 8.75 8.74996 8.27501 8.74996 7.10001Z"
        stroke="#107C10"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.74996 16.475V13.1083C8.74996 11.7833 8.21663 11.25 6.89163 11.25H3.52496C2.19996 11.25 1.66663 11.7833 1.66663 13.1083V16.475C1.66663 17.8 2.19996 18.3333 3.52496 18.3333H6.89163C8.21663 18.3333 8.74996 17.8 8.74996 16.475Z"
        stroke="#107C10"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 12.9167H17.5"
        stroke="#107C10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 16.25H17.5"
        stroke="#107C10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
