// src/components/ui/floating-dock.jsx — mobile navigation that magnifies on desktop
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

export function FloatingDock({ items, className, label = 'Quick navigation' }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.nav
      aria-label={label}
      onMouseMove={(event) => mouseX.set(event.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 items-end gap-1 rounded-[18px] border border-line bg-surface/92 px-1.5 py-1.5 shadow-float backdrop-blur-xl md:hidden',
        className,
      )}
    >
      {items.map((item) => (
        <DockItem key={item.title} item={item} mouseX={mouseX} />
      ))}
    </motion.nav>
  );
}

function DockItem({ item, mouseX }) {
  const ref = useRef(null);
  const distance = useTransform(mouseX, (value) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return value - bounds.x - bounds.width / 2;
  });
  const width = useSpring(useTransform(distance, [-110, 0, 110], [40, 54, 40]), {
    stiffness: 260,
    damping: 22,
  });
  const Icon = item.icon;

  const content = (
    <>
      <motion.span
        style={{ width }}
        className={cn(
          'flex h-10 items-center justify-center rounded-xl transition-colors',
          item.active ? 'bg-accent/10 text-accent' : 'text-ink-soft',
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </motion.span>
      <span className="sr-only">{item.title}</span>
    </>
  );

  if (item.to) {
    return (
      <Link
        ref={ref}
        to={item.to}
        onClick={item.onClick}
        aria-current={item.active ? 'page' : undefined}
        className="group relative flex flex-col items-center"
      >
        {content}
        {item.active && <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" aria-hidden="true" />}
      </Link>
    );
  }

  return (
    <button ref={ref} type="button" onClick={item.onClick} className="group relative flex flex-col items-center">
      {content}
      {item.active && <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" aria-hidden="true" />}
    </button>
  );
}
