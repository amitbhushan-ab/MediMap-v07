// src/components/ui/pointer-highlight.jsx — marks one phrase, not a whole headline
import { cn } from '../../lib/utils';

export function PointerHighlight({ children, className, boxClassName }) {
  return (
    <span className={cn('group/pointer relative inline-block', className)}>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-md border border-accent/0 bg-accent/0 transition-colors duration-300 group-hover/pointer:border-accent/25 group-hover/pointer:bg-accent/[0.06]',
          boxClassName,
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 -bottom-1 h-1 w-1 rounded-[1px] bg-accent/0 transition-colors duration-300 group-hover/pointer:bg-accent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-1 h-1 w-1 rounded-[1px] bg-accent/0 transition-colors duration-300 group-hover/pointer:bg-accent"
      />
    </span>
  );
}
