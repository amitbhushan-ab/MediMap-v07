// src/components/ui/background-gradient.jsx — gradient hairline frame
import { cn } from '../../lib/utils';

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = false,
  tone = 'accent',
}) {
  const gradient =
    tone === 'warm'
      ? 'conic-gradient(from 140deg at 50% 50%, rgb(var(--accent)/0.6), rgb(234 34 97/0.35), rgb(245 233 212/0.8), rgb(var(--accent)/0.6))'
      : 'conic-gradient(from 140deg at 50% 50%, rgb(var(--accent)/0.65), rgb(var(--accent-soft)/0.25), rgb(var(--accent)/0.65))';

  return (
    <div className={cn('relative overflow-hidden rounded-card p-px', containerClassName)}>
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-card opacity-60 transition-opacity duration-500 group-hover:opacity-100',
          animate && 'animate-spin-slow',
        )}
        style={{ background: gradient }}
      />
      <div className={cn('relative rounded-[13px] bg-surface', className)}>{children}</div>
    </div>
  );
}
