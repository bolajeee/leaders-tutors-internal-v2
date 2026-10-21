import { ReactNode } from "react";
import { Card } from "./Card";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export const StatTile = ({
  label,
  value,
  icon,
  hint,
  className = "",
}: StatTileProps) => (
  <Card hoverable className={`flex items-center gap-4 ${className}`}>
    {icon && (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient-soft text-primary ring-1 ring-primary/10">
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="truncate text-2xl font-bold-custom text-ink">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  </Card>
);
