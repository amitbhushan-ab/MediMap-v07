// src/components/ui/svg-mask-effect.jsx — Aceternity SVG Mask Effect, tokenised
// Quiet text sits underneath; the pointer lifts a highlighted layer out of it.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function MaskReveal({ base, overlay, className, radius = 180 }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(null);
  const animated = useMotionSafe();

  function onMouseMove(event) {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPosition({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  }

  const maskImage = position
    ? `radial-gradient(circle ${radius}px at ${position.x}px ${position.y}px, black 30%, transparent 78%)`
    : 'radial-gradient(circle 0px at 50% 50%, black, transparent)';

  return (
    <div
      ref={containerRef}
      onMouseMove={animated ? onMouseMove : undefined}
      onMouseLeave={() => setPosition(null)}
      className={cn('group/mask relative isolate select-none', className)}
    >
      <div className="relative z-0 text-muted/70">{base}</div>
      <motion.div
        aria-hidden="true"
        animate={{ opacity: position ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 z-10 text-ink"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        {overlay}
      </motion.div>
      {position && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70"
          style={{ left: position.x, top: position.y }}
        />
      )}
    </div>
  );
}
