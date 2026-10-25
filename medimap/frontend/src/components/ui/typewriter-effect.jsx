// src/components/ui/typewriter-effect.jsx — rotates through example queries
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

export function TypewriterEffect({
  words = [],
  typeSpeed = 70,
  deleteSpeed = 32,
  pause = 1600,
  className,
  cursorClassName,
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const animated = useMotionSafe();
  const current = words[wordIndex % Math.max(words.length, 1)] || '';

  useEffect(() => {
    if (!animated || !words.length) {
      setText(words[0] || '');
      return undefined;
    }
    if (!deleting && text === current) {
      const hold = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(hold);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setWordIndex((index) => (index + 1) % words.length);
      return undefined;
    }
    const timer = setTimeout(
      () => {
        setText((value) =>
          deleting ? current.slice(0, Math.max(0, value.length - 1)) : current.slice(0, value.length + 1),
        );
      },
      deleting ? deleteSpeed : typeSpeed,
    );
    return () => clearTimeout(timer);
  }, [text, deleting, current, words, typeSpeed, deleteSpeed, pause, animated]);

  return (
    <span className={cn('inline-flex items-baseline', className)} aria-hidden="true">
      <span>{text}</span>
      <span
        className={cn(
          'ml-0.5 inline-block h-[1em] w-px translate-y-[0.12em] animate-pulse bg-accent',
          cursorClassName,
        )}
      />
    </span>
  );
}
