// src/components/ui/badge.jsx — compact status and metadata
import { cn } from '../../lib/utils';

const TONES = {
  neutral: 'border-line bg-raised text-ink-soft',
  accent: 'border-accent/20 bg-accent/10 text-accent-ink',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  navy: 'border-white/15 bg-white/10 text-white',
  outline: 'border-line-strong/70 bg-transparent text-ink-soft',
};

export function Badge({ children, tone = 'neutral', dot = false, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {children}
    </span>
  );
}
