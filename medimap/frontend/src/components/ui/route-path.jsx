// src/components/ui/route-path.jsx — scroll-drawn route lines, after Aceternity's path effect
// Three parallel paths draw themselves as the section scrolls, then settle.
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

const PATHS = [
  'M0 150 C 90 150, 120 96, 190 96 S 300 132, 380 132 S 470 64, 560 64',
  'M0 178 C 90 178, 130 128, 200 128 S 305 164, 385 164 S 472 96, 560 96',
  'M0 206 C 92 206, 140 160, 210 160 S 310 196, 392 196 S 478 128, 560 128',
];

export function RoutePath({ className, label = 'Route' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'center 45%'] });
  const animated = useMotionSafe();

  const first = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const second = useTransform(scrollYProgress, [0, 1], [0.12, 1]);
  const third = useTransform(scrollYProgress, [0, 1], [0.12, 1]);
  const lengths = [first, second, third];

  return (
    <div ref={ref} className={cn('relative w-full', className)} aria-hidden="true">
      <svg viewBox="0 0 560 240" fill="none" className="h-full w-full">
        <defs>
          <linearGradient id="route-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--line-strong))" />
            <stop offset="55%" stopColor="rgb(var(--accent))" />
            <stop offset="100%" stopColor="rgb(var(--accent-soft))" />
          </linearGradient>
        </defs>

        {PATHS.map((d, index) => (
          <g key={d}>
            <path d={d} stroke="rgb(var(--line))" strokeWidth="1.25" strokeDasharray="3 5" />
            <motion.path
              d={d}
              stroke="url(#route-stroke)"
              strokeWidth={index === 0 ? 1.75 : 1.25}
              strokeLinecap="round"
              style={animated ? { pathLength: lengths[index] } : { pathLength: 1 }}
              opacity={index === 0 ? 1 : 0.55}
            />
          </g>
        ))}

        {[
          [0, 150],
          [190, 96],
          [380, 132],
          [560, 64],
        ].map(([cx, cy], index) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={index === 0 ? 3 : 2.5}
            fill={index === 0 ? 'rgb(var(--accent))' : 'rgb(var(--surface))'}
            stroke="rgb(var(--accent))"
            strokeWidth="1.25"
          />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
