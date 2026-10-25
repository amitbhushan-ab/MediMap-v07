// src/components/ui/flip-words.jsx — headline rotation with zero layout collisions
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function FlipWords({ words, duration = 2800, className, interval, highlight = true }) {
  const list = useMemo(() => (Array.isArray(words) ? words.filter(Boolean) : []), [words]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const animated = useMotionSafe();
  const every = interval || duration;

  useEffect(() => {
    if (list.length < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % list.length), every);
    return () => clearInterval(timer);
  }, [list.length, every, paused]);

  if (!list.length) return null;

  const current = list[index % list.length];

  return (
    <span
      className={cn('inline-block align-baseline', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="sr-only">{list.join(', ')}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          aria-hidden="true"
          initial={animated ? { opacity: 0, y: 10, filter: 'blur(4px)' } : false}
          animate={animated ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          exit={animated ? { opacity: 0, y: -10, filter: 'blur(4px)' } : {}}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn('inline-block align-baseline', highlight && 'text-accent')}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
