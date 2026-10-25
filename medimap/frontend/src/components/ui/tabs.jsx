// src/components/ui/tabs.jsx — segmented control with a shared indicator
import { useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function Tabs({ tabs, value, onChange, variant = 'pill', className, size = 'md' }) {
  const id = useId();
  const listRef = useRef(null);
  const animated = useMotionSafe();

  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === value);
    if (index < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(tabs[next].id);
    const buttons = listRef.current?.querySelectorAll('[role="tab"]');
    buttons?.[next]?.focus();
  }

  const isUnderline = variant === 'underline';

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        'flex items-center',
        isUnderline
          ? 'gap-5 border-b border-line'
          : 'w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-raised p-1 no-scrollbar',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150',
              isUnderline
                ? cn(
                    'border-b-2 px-0.5 pb-3 text-[13px]',
                    active
                      ? 'border-accent text-ink'
                      : 'border-transparent text-muted hover:text-ink',
                  )
                : cn(
                    'rounded-full',
                    size === 'sm' ? 'h-8 px-3 text-[11px]' : 'h-9 px-4 text-xs',
                    active ? 'text-ink' : 'text-muted hover:text-ink',
                  ),
            )}
          >
            {active && !isUnderline && (
              <motion.span
                layoutId={animated ? `${id}-indicator` : undefined}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full border border-line bg-surface shadow-card"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'tnum rounded-full px-1.5 py-0.5 text-[10px] leading-none',
                    active ? 'bg-accent/10 text-accent-ink' : 'bg-line/70 text-muted',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented filter used in toolbars. */
export function SegmentedControl({ options, value, onChange, className, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-line bg-raised p-1', className)}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
