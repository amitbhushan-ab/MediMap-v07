// src/components/ui/empty-state.jsx
import { cn } from '../../lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-panel border border-line bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      <div className="dot-grid absolute inset-0 opacity-40 mask-fade-b" aria-hidden="true" />
      <div className="relative z-10 flex max-w-sm flex-col items-center">
        {Icon && (
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-raised text-muted">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <h3 className="text-base font-medium text-ink">{title}</h3>
        {description && <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
