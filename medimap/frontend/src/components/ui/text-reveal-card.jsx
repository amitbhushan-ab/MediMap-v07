// src/components/ui/text-reveal-card.jsx — Aceternity Text Reveal Card, adapted to tokens
// Moving left to right lifts a second sentence out of the first.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function TextRevealCard({ text, revealText, children, className }) {
  const cardRef = useRef(null);
  const [percent, setPercent] = useState(0);
  const [hovering, setHovering] = useState(false);
  const animated = useMotionSafe();

  function move(clientX) {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPercent(Math.min(100, Math.max(0, ((clientX - bounds.left) / bounds.width) * 100)));
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setPercent(0);
      }}
      onMouseMove={animated ? (event) => move(event.clientX) : undefined}
      onTouchStart={() => setHovering(true)}
      onTouchEnd={() => {
        setHovering(false);
        setPercent(0);
      }}
      onTouchMove={animated ? (event) => move(event.touches[0].clientX) : undefined}
      className={cn(
        'relative overflow-hidden rounded-panel border border-line bg-surface p-6',
        className,
      )}
    >
      {children}

      <div className="relative mt-2 flex min-h-[92px] items-center overflow-hidden">
        <motion.div
          animate={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
          transition={hovering ? { duration: 0 } : { duration: 0.4 }}
          className="absolute inset-0 z-20 flex items-center will-change-transform"
          aria-hidden={percent === 0}
        >
          <p className="text-2xl font-medium leading-tight tracking-[-0.03em] text-accent-ink sm:text-[2rem]">
            {revealText}
          </p>
        </motion.div>

        <motion.div
          animate={{
            left: `${percent}%`,
            rotate: `${(percent - 50) * 0.08}deg`,
            opacity: percent > 0 ? 1 : 0,
          }}
          transition={hovering ? { duration: 0 } : { duration: 0.4 }}
          className="absolute z-30 h-24 w-px bg-gradient-to-b from-transparent via-accent/60 to-transparent"
          aria-hidden="true"
        />

        <p className="max-w-md select-none text-2xl font-medium leading-tight tracking-[-0.03em] text-muted/45 sm:text-[2rem]">
          {text}
        </p>
      </div>
    </div>
  );
}
