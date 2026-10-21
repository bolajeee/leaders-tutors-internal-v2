interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  frontIcon?: React.ReactNode;
  backIcon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "outline";
  fullWidth?: boolean;
  size?: "sm" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  text,
  frontIcon,
  className = "",
  backIcon,
  disabled,
  variant = "primary",
  fullWidth = false,
  isLoading,
  size = "lg",
  ...rest
}) => {
  const isDisabled = disabled || isLoading;
  const baseClasses =
    "inline-flex items-center justify-center gap-2 border px-6 font-medium-custom tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25";

  const currentSize =
    size === "sm"
      ? "h-[38px] text-sm gap-1.5 hover:gap-2.5 rounded-full px-4"
      : "h-[52px] text-[15px] gap-2 hover:gap-3 rounded-full"; // lg default

  // Brand gradient primary (indigo → orange) with glow; softer tonal variants elsewhere
  const buttonStyles =
    variant === "primary"
      ? "border-transparent bg-linear-to-r from-primary-hover via-primary to-secondary-hover bg-[length:200%_100%] bg-left text-white shadow-glow hover:bg-right"
      : variant === "secondary"
        ? "border-transparent bg-primary-light text-primary hover:bg-primary hover:text-white"
        : variant === "outline"
          ? "border-primary/30 bg-white text-primary hover:border-primary hover:bg-primary-light/60"
          : "border-transparent bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.28)] hover:bg-red-700";

  const disabledStyles = isDisabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

  if (isLoading) {
    return (
      <button
        disabled
        className={`flex justify-center items-center  ${currentSize}  ${
          fullWidth ? "w-full" : ""
        } bg-primary-light cursor-not-allowed rounded-full`}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </button>
    );
  }

  return (
    <button
      title={text}
      disabled={isDisabled}
      className={`${baseClasses} ${currentSize} ${buttonStyles} ${
        fullWidth ? "w-full" : ""
      } ${disabledStyles} ${className}`}
      {...rest}
    >
      {backIcon && <span className="flex items-center">{backIcon}</span>}
      <span>{text}</span>
      {frontIcon && <span className="flex items-center">{frontIcon}</span>}
    </button>
  );
};
