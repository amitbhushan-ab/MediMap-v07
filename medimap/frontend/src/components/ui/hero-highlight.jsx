// src/components/ui/hero-highlight.jsx — Aceternity HeroHighlight and Highlight, tokenised
// A dot field that warms under the cursor, plus a marker sweep for one phrase.
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function HeroHighlight({ children, className, containerClassName, radius = 220 }) {
  const mouseX = useMotionValue(-radius);
  const mouseY = useMotionValue(-radius);
  const animated = useMotionSafe();

  const mask = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`;

  function onMouseMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
  }

  return (
    <div
      onMouseMove={animated ? onMouseMove : undefined}
      className={cn('group/highlight relative isolate', containerClassName)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 [background-image:radial-gradient(rgb(var(--line-strong)/0.55)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_78%)]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/highlight:opacity-100 [background-image:radial-gradient(rgb(var(--accent)/0.55)_1px,transparent_1px)] [background-size:18px_18px]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  );
}

/** Aceternity's marker highlight. One phrase per page, never a whole heading. */
export function Highlight({ children, className, delay = 0.4 }) {
  const animated = useMotionSafe();
  return (
    <motion.span
      initial={animated ? { backgroundSize: '0% 100%' } : false}
      whileInView={{ backgroundSize: '100% 100%' }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', display: 'inline' }}
      className={cn(
        'box-decoration-clone rounded-[3px] bg-[linear-gradient(rgb(var(--accent-wash)),rgb(var(--accent-wash)))] px-1 text-accent-ink',
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
