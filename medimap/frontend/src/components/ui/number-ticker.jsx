// src/components/ui/number-ticker.jsx — counts once, when it is on screen
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function NumberTicker({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1400,
  className,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const animated = useMotionSafe();
  const [display, setDisplay] = useState(animated ? 0 : Number(value));

  useEffect(() => {
    if (!inView) return undefined;
    if (!animated) {
      setDisplay(Number(value));
      return undefined;
    }
    let frame;
    const start = performance.now();
    const target = Number(value) || 0;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, animated]);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span ref={ref} className={cn('tnum', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
