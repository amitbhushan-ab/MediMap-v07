// src/components/ui/orbiting-circles.jsx — Aceternity Orbiting Circles, tokenised
// A centre object with satellites on a slow rail. Icons stay upright.
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function OrbitSystem({ children, className, radius = 108 }) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div
        aria-hidden="true"
        className="absolute rounded-full border border-line"
        style={{ width: radius * 2, height: radius * 2 }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full border border-dashed border-line/70"
        style={{ width: radius * 1.4, height: radius * 1.4 }}
      />
      <div className="relative z-10 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function OrbitingCircle({
  children,
  radius = 108,
  duration = 26,
  delay = 0,
  startAngle = 0,
  reverse = false,
  className,
}) {
  const animated = useMotionSafe();
  const spin = animated
    ? { rotate: reverse ? -360 : 360 }
    : {};
  const counter = animated
    ? { rotate: reverse ? 360 : -360 }
    : {};

  return (
    <div
      className={cn('pointer-events-none absolute left-1/2 top-1/2', className)}
      style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
    >
      <div className="h-full w-full" style={{ transform: `rotate(${startAngle}deg)` }}>
        <motion.div
          className="relative h-full w-full"
          animate={spin}
          transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
            animate={counter}
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
