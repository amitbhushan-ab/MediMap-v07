// src/components/ui/card.jsx — the only card surface
import { cn } from '../../lib/utils';

const TONES = {
  surface: 'bg-surface border-line',
  raised: 'bg-surface border-line shadow-card',
  sunken: 'bg-raised border-line',
  navy: 'bg-navy border-white/10 text-white',
  cream: 'bg-cream border-line/70',
  transparent: 'bg-transparent border-transparent',
};

export function Card({ children, className, tone = 'surface', hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'relative rounded-card border',
        TONES[tone] || TONES.surface,
        hover &&
          'transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-line-strong/80 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('flex items-start justify-between gap-3 p-5 pb-0', className)}>{children}</div>;
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-t border-line px-5 py-3.5', className)}>
      {children}
    </div>
  );
}
