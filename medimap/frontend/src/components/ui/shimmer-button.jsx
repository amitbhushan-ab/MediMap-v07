// src/components/ui/shimmer-button.jsx
import { cn } from '../../lib/utils';

export function ShimmerButton({ children, className, as: Tag = 'button', tone = 'navy', ...props }) {
  const surface = tone === 'navy' ? 'bg-navy text-white' : 'bg-accent-solid text-white';
  return (
    <Tag
      className={cn(
        'group relative inline-flex h-10 select-none items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-[13px] font-medium',
        surface,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.22)_50%,transparent_70%)] bg-[length:200%_100%]"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Tag>
  );
}
