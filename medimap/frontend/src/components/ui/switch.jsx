// src/components/ui/switch.jsx — an actual toggle with a real label
import { cn } from '../../lib/utils';

export function Switch({ checked, onChange, label, description, id, className }) {
  return (
    <label
      htmlFor={id}
      className={cn('group inline-flex cursor-pointer select-none items-center gap-2.5', className)}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[22px] w-[38px] flex-shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line-strong/70 bg-sunken',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'left-[2px] translate-x-[16px]' : 'left-[2px] translate-x-0',
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-xs font-medium text-ink">{label}</span>}
          {description && <span className="block text-[11px] text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}
