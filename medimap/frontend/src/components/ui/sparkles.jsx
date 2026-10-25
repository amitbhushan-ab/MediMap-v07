// src/components/ui/sparkles.jsx — a small, quiet success accent
import { cn } from '../../lib/utils';

const POINTS = [
  [12, 30], [30, 12], [68, 18], [86, 38], [22, 66], [52, 78], [76, 62], [44, 42],
];

export function Sparkles({ count = 6, className, color = 'rgb(var(--accent))' }) {
  const points = POINTS.slice(0, Math.max(0, Math.min(count, POINTS.length)));
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {points.map(([x, y], index) => (
        <g key={`${x}-${y}`} style={{ animation: `pulseSoft ${2.4 + index * 0.3}s ease-in-out ${index * 0.18}s infinite` }}>
          <path
            d={`M${x} ${y - 2.4}L${x + 0.7} ${y - 0.7}L${x + 2.4} ${y}L${x + 0.7} ${y + 0.7}L${x} ${y + 2.4}L${x - 0.7} ${y + 0.7}L${x - 2.4} ${y}L${x - 0.7} ${y - 0.7}Z`}
            fill={color}
            fillOpacity="0.55"
          />
        </g>
      ))}
    </svg>
  );
}
