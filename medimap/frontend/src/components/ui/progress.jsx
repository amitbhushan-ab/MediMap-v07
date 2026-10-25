// src/components/ui/progress.jsx
import { cn } from '../../lib/utils';

export function Progress({ value = 0, max = 100, className, label, tone = 'accent' }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100));
  const fill = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
  }[tone];

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-[11px] font-medium text-muted">
          <span>{label}</span>
          <span className="tnum">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line/70"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
