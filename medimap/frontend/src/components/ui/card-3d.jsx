// src/components/ui/card-3d.jsx — pointer parallax for a single hero object
import { createContext, useContext, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { useMotionSafe } from '../../lib/motion';

const TiltContext = createContext([false, () => {}]);

export function CardContainer({ children, className, containerClassName, intensity = 10 }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const animated = useMotionSafe();

  function handleMouseMove(event) {
    if (!ref.current || !animated) return;
    const bounds = ref.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
    const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
    ref.current.style.transform = `rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg)`;
  }

  function handleMouseLeave() {
    setEntered(false);
    if (ref.current) ref.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }

  return (
    <TiltContext.Provider value={[entered, setEntered]}>
      <div
        className={cn('flex items-center justify-center', containerClassName)}
        style={{ perspective: '1200px' }}
      >
        <div
          ref={ref}
          onMouseEnter={() => setEntered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative flex items-center justify-center transition-transform duration-200 ease-out will-change-transform',
            className,
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </TiltContext.Provider>
  );
}

export function CardBody({ children, className }) {
  return (
    <div
      className={cn(
        'h-full w-full [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardItem({
  as: Tag = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...props
}) {
  const [entered] = useContext(TiltContext);
  const transform = entered
    ? `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    : 'translateX(0) translateY(0) translateZ(0) rotateX(0) rotateY(0) rotateZ(0)';

  return (
    <Tag
      className={cn('w-fit transition-transform duration-200 ease-out', className)}
      style={{ transform }}
      {...props}
    >
      {children}
    </Tag>
  );
}
