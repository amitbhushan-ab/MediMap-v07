// src/components/ui/button.jsx — one button, every surface
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const VARIANTS = {
  primary:
    'bg-accent-solid text-white shadow-[0_10px_24px_-14px_rgb(var(--accent-solid)/0.9)] hover:bg-accent-solid-hover active:bg-accent-solid-hover',
  secondary:
    'border border-line bg-surface text-ink hover:border-accent/45 hover:bg-raised',
  ghost: 'text-ink-soft hover:bg-raised hover:text-ink',
  outline: 'border border-line-strong/70 bg-transparent text-ink hover:bg-raised',
  dark: 'bg-navy text-white hover:bg-navy/90',
  cream: 'border border-line/70 bg-cream text-ink hover:bg-cream/75',
  danger: 'bg-danger text-white hover:opacity-90',
  link: 'h-auto px-0 text-accent hover:text-accent-ink',
};

const SIZES = {
  xs: 'h-8 gap-1.5 px-3 text-[11px]',
  sm: 'h-9 gap-1.5 px-3.5 text-xs',
  md: 'h-10 gap-2 px-4 text-[13px]',
  lg: 'h-12 gap-2 px-6 text-sm',
};

const BASE =
  'relative inline-flex select-none items-center justify-center rounded-full font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', to, href, loading = false, disabled, children, ...props },
  ref,
) {
  const classes = cn(
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    variant !== 'link' && (SIZES[size] || SIZES.md),
    className,
  );

  const content = (
    <>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});

/** Square, label-free control. Always pass an aria-label. */
export const IconButton = forwardRef(function IconButton(
  { className, variant = 'ghost', size = 'md', loading, children, ...props },
  ref,
) {
  const dimensions = { xs: 'h-7 w-7', sm: 'h-9 w-9', md: 'h-10 w-10', lg: 'h-12 w-12' };
  return (
    <button
      ref={ref}
      type="button"
      className={cn(BASE, VARIANTS[variant] || VARIANTS.ghost, dimensions[size], 'px-0', className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : children}
    </button>
  );
});
