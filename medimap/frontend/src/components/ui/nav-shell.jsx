// src/components/ui/nav-shell.jsx — Aceternity Resizable Navbar, adapted to MediMap tokens
// The bar starts flush with the page and settles into a floating capsule on scroll.
import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function NavShell({ children, scrolled, className }) {
  return (
    <motion.div
      animate={scrolled ? { y: 8, paddingLeft: 12, paddingRight: 12 } : { y: 0, paddingLeft: 0, paddingRight: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 34 }}
      className={cn('relative mx-auto w-full', className)}
    >
      <div
        className={cn(
          'relative flex h-14 items-center justify-between gap-3 transition-[background-color,border-color,box-shadow,border-radius] duration-300',
          scrolled
            ? 'rounded-full border border-line bg-canvas/85 px-3 shadow-lift backdrop-blur-xl'
            : 'rounded-none border border-transparent bg-transparent px-0',
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function NavLinks({ items, isActive, className, onNavigate }) {
  const [hovered, setHovered] = useState(null);
  const pillId = useId().replace(/:/g, '');

  return (
    <nav aria-label="Primary" className={cn('hidden items-center gap-0.5 md:flex', className)}>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {items.map((item, index) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onMouseEnter={() => setHovered(index)}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
                active ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {hovered === index && !active && (
                <motion.span
                  layoutId={`nav-hover-${pillId}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-raised"
                  aria-hidden="true"
                />
              )}
              {active && (
                <motion.span
                  layoutId={`nav-active-${pillId}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full border border-line bg-raised"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavSheet({ open, children, onClose }) {
  const animated = useMotionSafe();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // The sheet only exists below the md breakpoint; close it if the window grows.
    const desktop = window.matchMedia('(min-width: 768px)');
    function onBreakpoint(event) {
      if (event.matches) onClose?.();
    }

    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onBreakpoint);
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onBreakpoint);
      previousActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[110] md:hidden"
    >
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={animated ? { y: -12, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-x-3 top-3 max-h-[calc(100vh-1.5rem)] overflow-auto rounded-panel border border-line bg-surface p-4 shadow-float outline-none"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
