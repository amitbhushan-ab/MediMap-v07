// src/components/ui/step-loader.jsx — Aceternity Multi Step Loader, adapted for inline use
// The full-screen overlay is replaced by a compact rail: honest progress, no fake loop.
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StepLoader({ steps, active = 0, className, tone = 'accent' }) {
  return (
    <ol className={cn('relative space-y-0', className)}>
      {steps.map((step, index) => {
        const done = index < active;
        const current = index === active;
        const label = typeof step === 'string' ? step : step.label;
        const detail = typeof step === 'string' ? null : step.detail;

        return (
          <li key={label} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[9px] top-5 h-[calc(100%-12px)] w-px',
                  done ? 'bg-accent/45' : 'bg-line',
                )}
              />
            )}

            <span className="relative z-10 mt-0.5 flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center">
              {done ? (
                <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-accent/12 text-accent">
                  <Check className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
                </span>
              ) : current ? (
                <span className="relative flex h-[19px] w-[19px] items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-accent/50" />
                  <motion.span
                    className="absolute inset-0 rounded-full border border-accent"
                    animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              ) : (
                <span className="h-[19px] w-[19px] rounded-full border border-line-strong/70 bg-surface" />
              )}
            </span>

            <div className="min-w-0 flex-1 pb-0.5">
              <p
                className={cn(
                  'text-xs leading-snug',
                  current ? 'font-medium text-ink' : done ? 'text-ink-soft' : 'text-muted',
                )}
              >
                {label}
              </p>
              {detail && (
                <p className={cn('mt-0.5 text-[11px] leading-relaxed', current ? 'text-muted' : 'text-muted/80')}>
                  {detail}
                </p>
              )}
            </div>

            {current && (
              <span className={cn('mt-1 h-1 w-8 overflow-hidden rounded-full bg-line')} aria-hidden="true">
                <motion.span
                  className="block h-full w-1/2 rounded-full bg-accent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ backgroundColor: `rgb(var(--${tone}))` }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
