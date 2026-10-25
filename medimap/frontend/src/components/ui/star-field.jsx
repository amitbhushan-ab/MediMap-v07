// src/components/ui/star-field.jsx — star field after Aceternity's Stars Background
// Deterministic positions keep renders stable; motion is slow and optional.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function StarField({ count = 48, className, tone = '255 255 255' }) {
  const animated = useMotionSafe();

  const stars = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      top: rand() * 100,
      left: rand() * 100,
      size: rand() > 0.82 ? 2 : 1,
      opacity: 0.18 + rand() * 0.45,
      delay: rand() * 4,
      duration: 3 + rand() * 5,
    }));
  }, [count]);

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            backgroundColor: `rgb(${tone} / ${star.opacity})`,
          }}
          animate={animated ? { opacity: [star.opacity, star.opacity * 0.35, star.opacity] } : undefined}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
