// src/components/ui/moving-border.jsx — a CTA with a light running along its edge
import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function MovingBorderButton({
  borderRadius = '9999px',
  children,
  as: Component = 'button',
  containerClassName,
  borderClassName,
  duration = 4000,
  className,
  ...props
}) {
  const animated = useMotionSafe();

  return (
    <Component
      className={cn(
        'group relative inline-flex overflow-hidden rounded-full p-px text-xs font-medium',
        containerClassName,
      )}
      style={{ borderRadius }}
      {...props}
    >
      <span className="absolute inset-0" style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}>
        {animated ? (
          <MovingBorder duration={duration} rx="50%" ry="50%">
            <span
              className={cn(
                'block h-9 w-9 rounded-full bg-[radial-gradient(rgb(var(--accent))_30%,transparent_70%)] opacity-80 blur-[1px]',
                borderClassName,
              )}
            />
          </MovingBorder>
        ) : (
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(120deg,rgb(var(--accent)/0.55),transparent_45%,rgb(var(--accent-soft)/0.5))]" />
        )}
      </span>

      <span
        className={cn(
          'relative flex h-full w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-200 group-hover:border-line-strong',
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </span>
    </Component>
  );
}

export function MovingBorder({ children, duration = 4000, rx, ry, ...props }) {
  const pathRef = useRef(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength?.();
    if (!length) return;
    progress.set((time * (length / duration)) % length);
  });

  const x = useTransform(progress, (value) => pathRef.current?.getPointAtLength(value)?.x ?? 0);
  const y = useTransform(progress, (value) => pathRef.current?.getPointAtLength(value)?.y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        aria-hidden="true"
        {...props}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.span
        style={{ position: 'absolute', top: 0, left: 0, display: 'inline-block', transform }}
      >
        {children}
      </motion.span>
    </>
  );
}
