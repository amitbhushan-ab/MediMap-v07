// src/components/ui/card-hover-effect.jsx — grid cards with a shared hover wash
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function HoverEffect({ items = [], className }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item, index) => {
        const content = (
          <div
            className="group/card relative flex h-full flex-col rounded-card border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-300 hover:border-line-strong/80 hover:shadow-lift"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            <AnimatePresence>
              {hovered === index && (
                <motion.span
                  layoutId="hover-wash"
                  className="pointer-events-none absolute inset-0 rounded-card bg-accent/[0.045]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between gap-2">
                {item.badge ? (
                  <span className="eyebrow !text-[10px] !tracking-[0.12em] !text-accent-ink">{item.badge}</span>
                ) : (
                  <span />
                )}
                {item.meta && <span className="tnum text-[11px] text-muted">{item.meta}</span>}
              </div>
              {item.icon && <div className="mb-3 text-accent">{item.icon}</div>}
              <h3 className="text-sm font-medium tracking-[-0.015em] text-ink">{item.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">{item.description}</p>
              {item.footer && (
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] font-medium text-accent-ink">
                  {item.footer}
                </div>
              )}
            </div>
          </div>
        );

        return item.link ? (
          <Link key={item.link} to={item.link} className="block h-full">
            {content}
          </Link>
        ) : (
          <div key={item.title || index} className="h-full">
            {content}
          </div>
        );
      })}
    </div>
  );
}
