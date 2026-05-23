"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#3b82f6",
  className = "",
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });

  const isUp = data[data.length - 1] >= data[0];
  const lineColor = color === "auto" ? (isUp ? "#10b981" : "#ef4444") : color;
  const areaColor = color === "auto" ? (isUp ? "#10b981" : "#ef4444") : color;

  const polylinePoints = pts.join(" ");
  const areaPath =
    `M 0,${height} ` +
    pts.map((p) => `L ${p}`).join(" ") +
    ` L ${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={areaPath} fill={areaColor} fillOpacity={0.08} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r={2}
        fill={lineColor}
      />
    </svg>
  );
}
