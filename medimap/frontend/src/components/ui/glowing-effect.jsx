// src/components/ui/glowing-effect.jsx — Aceternity Glowing Effect, adapted to one accent
// A light travels along the border of the nearest card. The rainbow gradient is gone.
import { memo, useCallback, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export const GlowingEffect = memo(function GlowingEffect({
  blur = 0,
  inactiveZone = 0.72,
  proximity = 40,
  spread = 26,
  className,
  movementDuration = 1.4,
  borderWidth = 1,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const animated = useMotionSafe();
  const isDisabled = disabled || !animated;

  const handleMove = useCallback(
    (event) => {
      if (!containerRef.current) return;
      if (frame.current) cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;

        const { left, top, width, height } = element.getBoundingClientRect();
        const x = event?.x ?? lastPosition.current.x;
        const y = event?.y ?? lastPosition.current.y;
        if (event) lastPosition.current = { x, y };

        const center = [left + width * 0.5, top + height * 0.5];
        const distance = Math.hypot(x - center[0], y - center[1]);
        if (distance < 0.5 * Math.min(width, height) * inactiveZone) {
          element.style.setProperty('--active', '0');
          return;
        }

        const active = x > left - proximity && x < left + width + proximity && y > top - proximity && y < top + height + proximity;
        element.style.setProperty('--active', active ? '1' : '0');
        if (!active) return;

        const current = parseFloat(element.style.getPropertyValue('--start')) || 0;
        const target = (180 * Math.atan2(y - center[1], x - center[0])) / Math.PI + 90;
        const diff = ((target - current + 180) % 360) - 180;

        animate(current, current + diff, {
          duration: movementDuration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (value) => element.style.setProperty('--start', String(value)),
        });
      });
    },
    [inactiveZone, proximity, movementDuration],
  );

  useEffect(() => {
    if (isDisabled) return undefined;
    const onScroll = () => handleMove();
    const onPointer = (event) => handleMove(event);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.body.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      document.body.removeEventListener('pointermove', onPointer);
    };
  }, [handleMove, isDisabled]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        '--blur': `${blur}px`,
        '--spread': spread,
        '--start': '0',
        '--active': '0',
        '--border-width': `${borderWidth}px`,
      }}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300',
        !isDisabled && 'opacity-100',
        blur > 0 && 'blur-[var(--blur)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-full w-full rounded-[inherit]',
          'after:absolute after:inset-[calc(-1*var(--border-width))] after:rounded-[inherit] after:content-[""]',
          'after:[border:var(--border-width)_solid_transparent]',
          'after:[background:linear-gradient(rgb(var(--accent)),rgb(var(--accent-soft)))_border-box]',
          'after:[mask-composite:intersect]',
          'after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#0000_0deg,rgb(var(--accent))_calc(var(--spread)*0.6deg),#0000_calc(var(--spread)*2deg))]',
          'after:opacity-[var(--active)] after:transition-opacity after:duration-300',
        )}
      />
    </div>
  );
});
