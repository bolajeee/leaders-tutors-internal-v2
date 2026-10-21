interface FailureIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const FailureIcon: React.FC<FailureIconProps> = ({
  width = 43,
  height = 44,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 43 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.5 44C24.3234 44 27.1192 43.431 29.7277 42.3254C32.3362 41.2197 34.7063 39.5992 36.7028 37.5563C38.6993 35.5135 40.2829 33.0882 41.3634 30.419C42.4439 27.7499 43 24.8891 43 22C43 19.1109 42.4439 16.2501 41.3634 13.581C40.2829 10.9118 38.6993 8.48654 36.7028 6.44365C34.7063 4.40076 32.3362 2.78025 29.7277 1.67465C27.1192 0.569047 24.3234 0 21.5 0C15.7978 0 10.3292 2.31785 6.2972 6.44365C2.26517 10.5695 0 16.1652 0 22C0 27.8348 2.26517 33.4305 6.2972 37.5563C10.3292 41.6821 15.7978 44 21.5 44Z"
        fill="#EF4444"
      />
      <path
        d="M15 15L28 28M28 15L15 28"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};
