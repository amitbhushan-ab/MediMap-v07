// src/components/ui/lens.jsx — Aceternity Lens, adapted for pack images
// Hover the image and a circle of the same photo follows the pointer at 2x.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function Lens({ src, alt, className, size = 104, zoom = 2.1, children }) {
  const frameRef = useRef(null);
  const [point, setPoint] = useState(null);
  const animated = useMotionSafe();

  function track(event) {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setPoint({ x, y, w: bounds.width, h: bounds.height });
  }

  return (
    <div
      ref={frameRef}
      onMouseMove={animated ? track : undefined}
      onMouseLeave={() => setPoint(null)}
      className={cn('group/lens relative overflow-hidden', className)}
    >
      {children || <img src={src} alt={alt} className="h-full w-full object-cover" />}

      {point && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute z-20 rounded-full border border-white/70 shadow-float ring-1 ring-ink/10"
          style={{
            width: size,
            height: size,
            left: point.x - size / 2,
            top: point.y - size / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${point.w * zoom}px ${point.h * zoom}px`,
            backgroundPosition: `${-(point.x * zoom - size / 2)}px ${-(point.y * zoom - size / 2)}px`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}
