// src/components/ui/card-spotlight.jsx — cursor-following light inside a card
import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function CardSpotlight({
  children,
  radius = 320,
  color = 'rgb(var(--accent) / 0.14)',
  className,
  onMouseMove: onMouseMoveProp,
  ...props
}) {
  const mouseX = useMotionValue(-radius);
  const mouseY = useMotionValue(-radius);
  const animated = useMotionSafe();
  const ref = useRef(null);

  function handleMouseMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
    onMouseMoveProp?.(event);
  }

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 78%)`;

  return (
    <div
      ref={ref}
      onMouseMove={animated ? handleMouseMove : undefined}
      className={cn(
        'group/spotlight relative overflow-hidden rounded-card border border-line bg-surface',
        className,
      )}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{ background }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
