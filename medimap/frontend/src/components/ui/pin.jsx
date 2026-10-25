// src/components/ui/pin.jsx — Aceternity 3D Pin, adapted to MediMap tokens
// A card that tilts away to reveal a location pin and a soft radar ring.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function PinContainer({ children, title, to, className, containerClassName }) {
  const [hovered, setHovered] = useState(false);
  const animated = useMotionSafe();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={cn('group/pin relative flex items-center justify-center', containerClassName)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 flex h-32 items-start justify-center opacity-70" aria-hidden="true">
        <div className="relative h-32 w-32">
          {[0, 1.6, 3.2].map((delay) => (
            <motion.span
              key={delay}
              className="absolute inset-0 rounded-full border border-accent/30"
              initial={{ scale: 0.35, opacity: 0 }}
              animate={hovered ? { scale: [0.35, 1.15], opacity: [0, 0.55, 0] } : { scale: 0.35, opacity: 0 }}
              transition={{ duration: 3, repeat: hovered ? Infinity : 0, delay, ease: 'easeOut' }}
            />
          ))}
          <span className="absolute left-1/2 top-0 h-14 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
        </div>
      </div>

      <div
        className="relative z-10 w-full"
        style={{ perspective: '1200px' }}
      >
        <div
          className="w-full transition-transform duration-700 ease-out will-change-transform"
          style={{
            transform: hovered && animated ? 'rotateX(12deg) rotateY(-4deg) translateY(-14px)' : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {to ? (
            <Link
              to={to}
              className={cn(
                'block rounded-panel border border-line bg-surface shadow-lift transition-colors duration-300 group-hover/pin:border-accent/40',
                className,
              )}
            >
              {children}
            </Link>
          ) : (
            <div
              className={cn(
                'rounded-panel border border-line bg-surface shadow-lift transition-colors duration-300 group-hover/pin:border-accent/40',
                className,
              )}
            >
              {children}
            </div>
          )}
        </div>
      </div>

      {title && (
        <span className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted opacity-0 shadow-card transition-opacity duration-300 group-hover/pin:opacity-100">
          {title}
        </span>
      )}
    </div>
  );
}
