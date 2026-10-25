// src/components/ui/avatar.jsx
import { cn } from '../../lib/utils';
import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-20 w-20 text-lg',
};

export function Avatar({ name = '', src, size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-raised font-medium text-ink-soft',
        SIZES[size] || SIZES.md,
        className,
      )}
      title={name || undefined}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {!src && <span className="sr-only">{name}</span>}
    </span>
  );
}
