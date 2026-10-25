// src/components/ui/aurora-background.jsx — slow colour wash for auth and empty states
import { cn } from '../../lib/utils';

export function AuroraBackground({ children, className, showRadial = true }) {
  return (
    <div className={cn('relative flex min-h-full w-full overflow-hidden bg-canvas', className)}>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -inset-[10px] opacity-45 blur-[14px] will-change-transform animate-aurora dark:opacity-30',
        )}
        style={{
          backgroundImage:
            'repeating-linear-gradient(100deg, rgb(var(--canvas)) 0%, rgb(var(--canvas)) 7%, transparent 10%, transparent 12%, rgb(var(--canvas)) 16%), repeating-linear-gradient(100deg, rgb(var(--accent) / 0.22) 10%, rgb(185 185 249 / 0.5) 15%, rgb(245 233 212 / 0.55) 20%, rgb(234 34 97 / 0.14) 25%, rgb(var(--accent) / 0.18) 30%)',
          backgroundSize: '300%, 200%',
          backgroundPosition: '50% 50%, 50% 50%',
          maskImage:
            'radial-gradient(ellipse at 70% 20%, #000 12%, transparent 72%), linear-gradient(to bottom, #000 35%, transparent 92%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 70% 20%, #000 12%, transparent 72%), linear-gradient(to bottom, #000 35%, transparent 92%)',
        }}
      />
      {showRadial && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,rgb(var(--canvas))_78%)]"
        />
      )}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
