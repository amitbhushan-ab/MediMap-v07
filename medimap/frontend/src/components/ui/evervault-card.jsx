// src/components/ui/evervault-card.jsx — Aceternity Evervault Card, adapted to tokens
// A field of characters only resolves under the pointer, which suits a privacy claim.
import { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomField(length = 900) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  return out;
}

export function EvervaultCard({ text, className, radius = 190 }) {
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);
  const [field, setField] = useState(() => randomField());
  const lastMove = useRef(0);
  const animated = useMotionSafe();

  const mask = useMotionTemplate`radial-gradient(${radius}px at ${mouseX}px ${mouseY}px, white, transparent)`;

  function onMouseMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
    const now = Date.now();
    if (now - lastMove.current > 90) {
      lastMove.current = now;
      setField(randomField());
    }
  }

  return (
    <div className={cn('relative flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden rounded-panel border border-line bg-surface', className)}>
      <div
        onMouseMove={animated ? onMouseMove : undefined}
        className="group/evervault relative flex h-full w-full items-center justify-center"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-[10px] leading-[1.15] tracking-[0.06em] text-accent/25"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <p className="break-all">{field}</p>
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/evervault:opacity-100"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
            background: 'radial-gradient(60% 60% at 50% 50%, rgb(var(--accent) / 0.08), transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-canvas/90 text-accent backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-6 w-6" aria-hidden="true">
              <path d="M12 3 4 6v6c0 4.4 3.4 7.9 8 9 4.6-1.1 8-4.6 8-9V6l-8-3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {text && <p className="text-sm font-medium text-ink">{text}</p>}
        </div>
      </div>
    </div>
  );
}
