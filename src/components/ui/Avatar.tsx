interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const Avatar = ({ name, size = "md", className = "" }: AvatarProps) => (
  <div
    aria-label={name}
    className={`flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold-custom text-white shadow-glow ring-2 ring-white ${SIZES[size]} ${className}`}
  >
    {initials(name) || "?"}
  </div>
);
