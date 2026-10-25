// src/components/ui/scroll-container.jsx — Aceternity Container Scroll Animation, tokenised
// The preview starts tipped back and settles flat as it enters the viewport.
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function ScrollContainer({ title, children, className, frameLabel = 'Preview' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const animated = useMotionSafe();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const rotateX = useTransform(scrollYProgress, [0, 0.55], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.55], mobile ? [0.92, 1] : [0.96, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.55], [mobile ? 30 : 60, 0]);
  const shadowOpacity = useTransform(scrollYProgress, [0, 0.55], [0.08, 0.16]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {title && (
        <motion.div style={animated ? { y: translateY } : undefined} className="relative z-10">
          {title}
        </motion.div>
      )}

      <div style={{ perspective: '1400px' }} className="relative mt-8">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-2 h-16 rounded-[50%] bg-navy blur-2xl"
          style={{ opacity: shadowOpacity }}
        />

        <motion.div
          style={animated ? { rotateX, scale, y: translateY } : undefined}
          className="relative overflow-hidden rounded-panel border border-line bg-surface shadow-float"
        >
          <div className="flex items-center gap-2 border-b border-line bg-raised/70 px-3 py-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-line-strong/70" />
              <span className="h-2 w-2 rounded-full bg-line-strong/70" />
              <span className="h-2 w-2 rounded-full bg-line-strong/70" />
            </span>
            <span className="mx-auto truncate text-[11px] font-medium text-muted">{frameLabel}</span>
            <span className="w-8" aria-hidden="true" />
          </div>
          <div className="relative">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
