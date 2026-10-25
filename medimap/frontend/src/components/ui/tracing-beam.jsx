// src/components/ui/tracing-beam.jsx — a progress rail tied to scroll
import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

export function TracingBeam({ children, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-3 hidden w-px bg-line lg:block" aria-hidden="true">
        <motion.div
          className="h-full w-px origin-top bg-gradient-to-b from-accent via-accent/70 to-accent/20"
          style={{ scaleY }}
        />
      </div>
      <div className="lg:pl-12">{children}</div>
    </div>
  );
}
