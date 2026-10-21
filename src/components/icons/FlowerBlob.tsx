import React from "react";

interface FlowerBlobProps {
  className?: string;
  width?: number;
  height?: number;
  petals?: number;
}

export default function FlowerBlob({
  className,
  width = 120,
  height = 120,
  petals = 6,
}: FlowerBlobProps) {
  const radius = 45; // distance from center
  const petalSize = 40; // radius of each petal circle
  const angleStep = (2 * Math.PI) / petals;

  const round = (num: number, decimals = 4) => Number(num.toFixed(decimals));

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
    >
      <g transform="translate(100 100)">
        {Array.from({ length: petals }).map((_, i) => {
          const angle = i * angleStep;
          const x = round(radius * Math.cos(angle));
          const y = round(radius * Math.sin(angle));
          return (
            <circle key={i} cx={x} cy={y} r={petalSize} fill="currentColor" />
          );
        })}
      </g>
    </svg>
  );
}
