// src/components/ui/dotted-glow.jsx — Aceternity Dotted Glow Background, tokenised
// A measured dot field with a single soft glow that follows the pointer.
import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function DottedGlow({ className, radius = 320, tone = 'var(--accent)' }) {
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const ref = useRef(null);
  const animated = useMotionSafe();

  const glow = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, rgb(${tone} / 0.55), transparent 72%)`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onMouseMove={
        animated
          ? (event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              mouseX.set(event.clientX - bounds.left);
              mouseY.set(event.clientY - bounds.top);
            }
          : undefined
      }
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute inset-0 [background-image:radial-gradient(rgb(var(--line-strong)/0.5)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_76%)]" />
      <motion.div
        className="absolute inset-0 [background-image:radial-gradient(rgb(var(--accent)/0.85)_1px,transparent_1px)] [background-size:20px_20px] opacity-70"
        style={{ maskImage: glow, WebkitMaskImage: glow }}
      />
      <motion.div
        className="absolute h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ left: mouseX, top: mouseY, background: `rgb(${tone} / 0.35)` }}
      />
    </div>
  );
}
