// src/components/ui/grid-pattern.jsx — engineering-paper backgrounds
import { useId } from 'react';
import { cn } from '../../lib/utils';

export function GridPattern({ className, size = 64, strokeWidth = 1, offset = 0 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full text-line', className)}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`grid-${id}`}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offset}
          y={offset}
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeOpacity="0.55"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
    </svg>
  );
}

export function DotPattern({ className, size = 22, radius = 1 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full text-line-strong', className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id={`dots-${id}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" fillOpacity="0.45" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dots-${id})`} />
    </svg>
  );
}
