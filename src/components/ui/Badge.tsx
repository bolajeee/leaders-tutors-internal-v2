import { ReactNode } from "react";

export type BadgeTone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-primary-light text-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-slate-100 text-slate-600",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge = ({
  tone = "neutral",
  children,
  className = "",
  dot = false,
}: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium-custom ${TONES[tone]} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);
