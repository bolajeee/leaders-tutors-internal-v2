import { LucideIcon } from "lucide-react";

interface PillButtonProps {
  label: string;
  value: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  icon?: LucideIcon;
  className?: string;
}

export const PillButton = ({
  label,
  value,
  isSelected,
  onClick,
  icon: Icon,
  className = "",
}: PillButtonProps) => {
  const baseClasses =
    "px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 cursor-pointer border-2 flex items-center gap-2";

  const selectedClasses = "bg-mtn-100 text-mtn-800 border-mtn-400 shadow-md";
  const unselectedClasses =
    "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300";

  const buttonClasses = `${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} ${className}`;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={buttonClasses}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
};
