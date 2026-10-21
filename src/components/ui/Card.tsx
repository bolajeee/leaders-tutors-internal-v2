import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padded?: boolean;
}

export const Card = ({
  hoverable = false,
  padded = true,
  className = "",
  children,
  ...rest
}: CardProps) => (
  <div
    className={`card-surface ${hoverable ? "card-surface-hover" : ""} ${
      padded ? "p-5" : ""
    } ${className}`}
    {...rest}
  >
    {children}
  </div>
);
