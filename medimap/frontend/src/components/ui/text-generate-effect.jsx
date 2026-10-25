// src/components/ui/text-generate-effect.jsx — a paragraph that resolves into place
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.45,
  staggerDelay = 0.018,
  as: Tag = 'p',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const animated = useMotionSafe();
  const list = String(words || '').split(/\s+/).filter(Boolean);
  const MotionTag = motion[Tag] || motion.p;

  return (
    <MotionTag
      ref={ref}
      className={cn('inline', className)}
      initial="hidden"
      animate={inView || !animated ? 'show' : 'hidden'}
    >
      <span className="sr-only">{list.join(' ')}</span>
      {list.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          className="inline-block will-change-[opacity,filter]"
          variants={{
            hidden: {
              opacity: 0,
              y: 6,
              filter: filter ? 'blur(6px)' : 'blur(0px)',
            },
            show: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration, delay: index * staggerDelay, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {word}
          {index < list.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </MotionTag>
  );
}
