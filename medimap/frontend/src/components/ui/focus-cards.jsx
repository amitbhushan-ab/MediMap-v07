// src/components/ui/focus-cards.jsx — Aceternity Focus Cards, adapted to MediMap tokens
// Hovering one card softens the others so a single idea holds the eye.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function FocusCards({ cards, className, columns = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  const [hovered, setHovered] = useState(null);
  const animated = useMotionSafe();

  return (
    <div className={cn('grid grid-cols-1 gap-3', columns, className)}>
      {cards.map((card, index) => {
        const dimmed = animated && hovered !== null && hovered !== index;
        const inner = (
          <motion.div
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            animate={{ opacity: dimmed ? 0.55 : 1, scale: dimmed ? 0.985 : 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition-colors duration-300',
              hovered === index && 'border-accent/40',
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(130%_90%_at_10%_0%,rgb(var(--accent)/0.08),transparent_65%)]" style={{ opacity: hovered === index ? 1 : 0 }} />
            {card.visual && <div className="relative mb-4">{card.visual}</div>}
            <div className="relative mt-auto">
              <h3 className="text-sm font-medium text-ink">{card.title}</h3>
              {card.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{card.description}</p>
              )}
              {card.meta && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">{card.meta}</p>
              )}
            </div>
          </motion.div>
        );

        return card.to ? (
          <Link key={card.key || card.title} to={card.to} className="block h-full rounded-card">
            {inner}
          </Link>
        ) : (
          <div key={card.key || card.title} className="h-full">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
