// src/components/ui/direction-hover.jsx — Aceternity Direction Aware Hover, tokenised
// The overlay enters from whichever edge the pointer crossed.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

const OFFSETS = {
  top: { x: 0, y: '-100%' },
  bottom: { x: 0, y: '100%' },
  left: { x: '-100%', y: 0 },
  right: { x: '100%', y: 0 },
};

export function DirectionHoverCard({ children, overlay, to, className, tone = 'accent' }) {
  const ref = useRef(null);
  const [direction, setDirection] = useState('top');
  const [active, setActive] = useState(false);
  const animated = useMotionSafe();

  function track(event) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setDirection(
      Math.min(x, bounds.width - x, y, bounds.height - y) === y
        ? 'top'
        : Math.min(x, bounds.width - x) === x
          ? 'left'
          : Math.min(bounds.width - x, bounds.height - y) === bounds.width - x
            ? 'right'
            : 'bottom',
    );
  }

  const body = (
    <div
      ref={ref}
      onMouseEnter={(event) => {
        if (!animated) return;
        track(event);
        setActive(true);
      }}
      onMouseLeave={() => setActive(false)}
      className={cn(
        'group/dir relative overflow-hidden rounded-card border border-line bg-surface',
        className,
      )}
    >
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={active && animated ? { x: 0, y: 0, opacity: 1 } : { ...OFFSETS[direction], opacity: 0 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
        style={{ background: `linear-gradient(140deg, rgb(var(--${tone}) / 0.1), rgb(var(--${tone}) / 0.02))` }}
      />
      <div className="relative z-10">{children}</div>
      {overlay && (
        <div className="relative z-10 border-t border-line/70 px-4 py-3 text-[11px] text-muted">{overlay}</div>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full rounded-card">
      {body}
    </Link>
  ) : (
    body
  );
}
