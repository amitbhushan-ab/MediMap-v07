// src/components/ui/bento-grid.jsx — asymmetric feature grid
import { cn } from '../../lib/utils';

export function BentoGrid({ children, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  badge,
  footer,
  onClick,
  as: Tag = 'div',
  ...props
}) {
  const interactive = Boolean(onClick) || Tag !== 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'group/bento relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] duration-300 ease-out',
        interactive && 'cursor-pointer hover:-translate-y-0.5 hover:border-line-strong/80 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {header && (
        <div className="relative mb-4 overflow-hidden rounded-[10px] border border-line bg-raised">
          {header}
        </div>
      )}
      <div className="relative z-10 flex flex-1 flex-col">
        {(icon || badge) && (
          <div className="mb-3 flex items-center justify-between gap-2">
            {icon ? <span className="text-accent">{icon}</span> : <span />}
            {badge && (
              <span className="eyebrow !text-[10px] !tracking-[0.12em] !text-muted">{badge}</span>
            )}
          </div>
        )}
        {title && (
          <h3 className="text-[15px] font-medium leading-snug tracking-[-0.015em] text-ink">{title}</h3>
        )}
        {description && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
        )}
        {footer && <div className="mt-4 flex items-center justify-between border-t border-line pt-3">{footer}</div>}
      </div>
    </Tag>
  );
}
