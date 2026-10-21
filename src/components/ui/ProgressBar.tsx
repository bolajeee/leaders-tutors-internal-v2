interface ProgressBarProps {
  value: number; // 0 – 100
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({
  value,
  className = "",
  showLabel = false,
}: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-primary-light"
      >
        <div
          className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium-custom text-muted">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};
