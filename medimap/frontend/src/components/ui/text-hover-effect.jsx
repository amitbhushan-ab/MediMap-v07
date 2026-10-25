// src/components/ui/text-hover-effect.jsx — Aceternity Text Hover Effect, tokenised
// The wordmark is drawn once, then re-lit under the pointer.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function TextHoverEffect({ text, className, duration = 0.2 }) {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [mask, setMask] = useState({ cx: '50%', cy: '50%' });
  const animated = useMotionSafe();
  const id = text.replace(/\s+/g, '-').toLowerCase();

  useEffect(() => {
    if (!cursor || !svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    setMask({
      cx: `${((cursor.x - bounds.left) / bounds.width) * 100}%`,
      cy: `${((cursor.y - bounds.top) / bounds.height) * 100}%`,
    });
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 90"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={text}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(event) => setCursor({ x: event.clientX, y: event.clientY })}
      className={cn('w-full select-none', className)}
    >
      <defs>
        <linearGradient id={`lit-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--accent-soft))" />
          <stop offset="50%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent-ink))" />
        </linearGradient>
        <motion.radialGradient
          id={`reveal-${id}`}
          gradientUnits="userSpaceOnUse"
          r="24%"
          initial={{ cx: '50%', cy: '50%' }}
          animate={mask}
          transition={{ duration, ease: 'easeOut' }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={`mask-${id}`}>
          <rect x="0" y="0" width="300" height="90" fill={`url(#reveal-${id})`} />
        </mask>
      </defs>

      <text
        x="150"
        y="48"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-transparent stroke-line-strong text-[46px] font-medium tracking-[-0.04em]"
        strokeWidth="0.4"
        style={{ opacity: hovered ? 0.9 : 0 }}
      >
        {text}
      </text>

      <motion.text
        x="150"
        y="48"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="none"
        stroke="rgb(var(--line-strong))"
        strokeWidth="0.35"
        className="text-[46px] font-medium tracking-[-0.04em]"
        initial={animated ? { strokeDashoffset: 900, strokeDasharray: 900 } : false}
        whileInView={{ strokeDashoffset: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 3.2, ease: 'easeInOut' }}
      >
        {text}
      </motion.text>

      <text
        x="150"
        y="48"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="none"
        stroke={`url(#lit-${id})`}
        strokeWidth="0.45"
        mask={`url(#mask-${id})`}
        className="text-[46px] font-medium tracking-[-0.04em]"
      >
        {text}
      </text>
    </svg>
  );
}
