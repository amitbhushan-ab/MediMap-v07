// src/components/ui/meteors.jsx — optional sparse background texture
import { cn } from '../../lib/utils';

export function Meteors({ number = 12, className }) {
  const meteors = Array.from({ length: number }, (_, index) => {
    const left = ((index * 137) % 800) - 400;
    return {
      left,
      delay: ((index * 0.37) % 1.2).toFixed(2),
      duration: 4 + ((index * 0.83) % 4),
    };
  });

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)} aria-hidden="true">
      {meteors.map((meteor, index) => (
        <span
          key={index}
          className="absolute top-0 h-px w-px rotate-[215deg] rounded-full bg-accent/60 before:absolute before:top-1/2 before:h-px before:w-[60px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-accent/70 before:to-transparent before:content-['']"
          style={{
            left: meteor.left,
            animation: `meteor ${meteor.duration}s linear ${meteor.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
