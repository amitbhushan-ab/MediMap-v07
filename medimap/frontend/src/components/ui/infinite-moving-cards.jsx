// src/components/ui/infinite-moving-cards.jsx — a calmer live feed
import { cn } from '../../lib/utils';

const SPEEDS = { fast: 26, normal: 46, slow: 74 };

export function InfiniteMovingCards({
  items = [],
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
  renderItem,
}) {
  if (!items.length) return null;
  const duration = SPEEDS[speed] || SPEEDS.normal;

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden py-2 mask-fade-x',
        className,
      )}
      style={{ '--marquee-duration': `${duration}s` }}
    >
      <ul
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap gap-3',
          direction === 'right' ? 'animate-marquee-reverse' : 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
      >
        {items.map((item, index) => (
          <li key={`${item?.name || item?.pharmacy || 'item'}-${index}`} className="w-[290px] flex-shrink-0 sm:w-[330px]">
            {renderItem ? renderItem(item, index) : <DefaultCard item={item} />}
          </li>
        ))}
        {items.map((item, index) => (
          <li
            key={`clone-${item?.name || item?.pharmacy || 'item'}-${index}`}
            aria-hidden="true"
            className="w-[290px] flex-shrink-0 sm:w-[330px]"
          >
            {renderItem ? renderItem(item, index) : <DefaultCard item={item} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DefaultCard({ item }) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-card border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-strong/80">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium text-muted">{item.tag}</span>
        {typeof item.price === 'number' && (
          <span className="tnum text-sm font-medium text-ink">
            ₹{item.price.toFixed(item.price % 1 === 0 ? 0 : 2)}
          </span>
        )}
      </div>
      <blockquote className="mt-3 text-xs leading-relaxed text-ink-soft">{item.note || item.quote}</blockquote>
      <figcaption className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        <span className="font-medium text-ink">{item.pharmacy || item.name}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate">{item.area || item.title}</span>
      </figcaption>
    </figure>
  );
}
