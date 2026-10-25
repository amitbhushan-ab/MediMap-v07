// src/components/ui/lamp.jsx — Aceternity Lamp, adapted to MediMap tokens
// A heated line with a soft cone of light below it. No hard edges.
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function Lamp({ className, width = '40rem', height = '22rem', tone = 'var(--accent)' }) {
  const animated = useMotionSafe();

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center', className)}
    >
      <div className="relative" style={{ width, maxWidth: '96vw', height }}>
        <motion.div
          initial={animated ? { opacity: 0, scaleX: 0.7 } : false}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-0 origin-top"
        >
          <div
            className="mx-auto h-px w-[58%]"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(${tone} / 0.7), transparent)`,
              boxShadow: `0 0 18px 1px rgb(${tone} / 0.35)`,
            }}
          />

          <div
            className="mx-auto h-full w-full blur-2xl"
            style={{
              height,
              background: `conic-gradient(from 162deg at 50% 0%, transparent 0deg, rgb(${tone} / 0.26) 18deg, transparent 36deg)`,
              maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 88%)',
            }}
          />
        </motion.div>

        <div
          className="absolute left-1/2 top-0 h-24 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `rgb(${tone} / 0.16)` }}
        />
      </div>
    </div>
  );
}
