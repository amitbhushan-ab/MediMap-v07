// src/components/ui/background-boxes.jsx — Aceternity Background Boxes, tokenised
// A quiet grid of cells; the row and column under the pointer lift slightly.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function BackgroundBoxes({ className, rows = 10, columns = 18, tone = 'accent' }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      aria-hidden="true"
      onMouseLeave={() => setHovered(null)}
      className={cn('pointer-events-auto absolute inset-0 grid overflow-hidden', className)}
      style={{
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows * columns }).map((_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const lit = hovered !== null && (hovered.row === row || hovered.column === column);

        return (
          <motion.span
            key={index}
            onMouseEnter={() => setHovered({ row, column })}
            animate={{ opacity: lit ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative border-[0.5px] border-line/25"
            style={{
              background: `linear-gradient(140deg, rgb(var(--${tone}) / 0.12), rgb(var(--${tone}) / 0.03))`,
            }}
          />
        );
      })}
    </div>
  );
}
