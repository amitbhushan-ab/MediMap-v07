// src/components/ui/section.jsx — page rhythm
import { cn } from '../../lib/utils';

export function Container({ children, className }) {
  return <div className={cn('container-page', className)}>{children}</div>;
}

export function Section({ children, className, id, spacing = 'default' }) {
  const pad = {
    none: '',
    tight: 'py-10 sm:py-12',
    default: 'py-16 sm:py-20',
    loose: 'py-20 sm:py-28',
  }[spacing];
  return (
    <section id={id} className={cn('relative', pad, className)}>
      {children}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, description, action, align = 'left', className }) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <div className={cn('eyebrow mb-3', centered && 'justify-center')}>
            <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
            {eyebrow}
          </div>
        )}
        {title && <h2 className="display-1 text-ink">{title}</h2>}
        {description && (
          <p className={cn('lead mt-3 text-[15px]', centered && 'mx-auto')}>{description}</p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <header className={cn('relative border-b border-line bg-canvas', className)}>
      <div className="mesh-atmosphere">
        <Container className="relative z-10 py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              {eyebrow && (
                <div className="eyebrow mb-3">
                  <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                  {eyebrow}
                </div>
              )}
              <h1 className="display-1 text-ink">{title}</h1>
              {description && <p className="lead mt-3 text-[15px]">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {children}
        </Container>
      </div>
    </header>
  );
}

export function Stat({ value, label, detail, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="tnum text-[1.65rem] font-light leading-none tracking-[-0.03em] text-ink">{value}</div>
      <div className="mt-2 text-xs font-medium text-ink-soft">{label}</div>
      {detail && <div className="mt-0.5 text-[11px] text-muted">{detail}</div>}
    </div>
  );
}
