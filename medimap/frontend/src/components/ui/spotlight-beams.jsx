// src/components/ui/spotlight-beams.jsx — Aceternity Spotlight, adapted to MediMap tokens
// Two wide beams entering from the top corners. Purely decorative.
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function SpotlightBeams({
  className,
  duration = 9,
  offset = 70,
  tone = 'var(--accent)',
  opacity = 0.5,
}) {
  const animated = useMotionSafe();

  const beam = (side) => (
    <motion.div
      animate={animated ? { x: [0, side * offset, 0] } : undefined}
      transition={{ duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      className={cn('absolute top-0 h-full w-[46rem]', side < 0 ? '-left-[26rem]' : '-right-[26rem]')}
      style={{
        transform: `rotate(${side * 38}deg)`,
        transformOrigin: side < 0 ? 'top right' : 'top left',
        opacity,
      }}
    >
      <div
        className="h-full w-full blur-[2px]"
        style={{
          background: `linear-gradient(to right, transparent, rgb(${tone} / 0.18) 45%, transparent 78%)`,
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />
    </motion.div>
  );

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {beam(-1)}
      {beam(1)}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, rgb(${tone} / 0.14), transparent 72%)`,
        }}
      />
    </div>
  );
}
