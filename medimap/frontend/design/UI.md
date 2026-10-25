# MediMap interface brief

Read this before touching a page. The goal is a calm, precise health utility — not a landing-page template.

## Non-negotiables

1. **Presentation only.** Keep every route, query string, API call, `localStorage` key, handler, OCR flow, and piece of state exactly as it is. Do not rename exports. Do not add features.
2. **No new dependencies, no global CSS edits.** `index.css`, `tailwind.config.js`, `lib/*` and `components/ui/*` are owned by the design pass. Edit only the files assigned to you.
3. **Tokens, not hex.** `bg-surface`, `bg-canvas`, `bg-raised`, `bg-sunken`, `text-ink`, `text-ink-soft`, `text-muted`, `border-line`, `border-line-strong`, `text-accent`, `bg-accent`, `text-success`, `text-warning`, `text-danger`. These already switch with dark mode. A `dark:` variant should only remain for maps, images, or third-party widgets.
4. **No emoji, no exclamation marks, no shouted headings.** Uppercase is reserved for `.eyebrow` micro-labels.
5. **Icons come from `lucide-react`**, stroke width 1.75, sized 14–18px. Inline SVG only for charts, maps, or the logo.
6. **Indian rupees use the `₹` glyph and tabular numerals** (`font-variant-numeric` via `.tnum` or `formatPrice`).

## Kit

```jsx
import { Button, IconButton } from '../components/ui/button';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input, Textarea, Select, Field } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Skeleton, SkeletonText } from '../components/ui/skeleton';
import { Tabs, SegmentedControl } from '../components/ui/tabs';
import { Modal } from '../components/ui/modal';
import { Avatar } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { EmptyState } from '../components/ui/empty-state';
import { Container, Section, SectionHeader, PageHeader, Stat } from '../components/ui/section';
import { formatPrice, formatNumber, formatDistance, timeAgo, initials, pick } from '../lib/format';
```

Aceternity components (use deliberately, never three in one viewport):

| Import | Use for |
| --- | --- |
| `Spotlight` | one soft light on a hero; skip in light mode if it looks muddy |
| `BackgroundBeams` | hero backdrop, `opacity` 0.4–0.6 |
| `GridPattern`, `DotPattern` | structural backgrounds behind panels |
| `AuroraBackground` | auth screens and full-page empty states |
| `FlipWords` | headline subject that rotates |
| `TextGenerateEffect` | one lead paragraph resolving word by word |
| `TypewriterEffect` | input placeholder / demo string |
| `NumberTicker` | animated statistic |
| `MovingBorderButton`, `ShimmerButton` | at most one premium CTA per page |
| `CardSpotlight` | feature cards with cursor light |
| `CardContainer`, `CardBody`, `CardItem` | a single 3D object (medicine pack, price card) |
| `BentoGrid`, `BentoGridItem` | asymmetric feature sections |
| `InfiniteMovingCards` | live stock feed; honour the custom `renderItem` |
| `Timeline` | dated events or order status |
| `TracingBeam` | long editorial content |
| `StickyScrollReveal` | three-to-five step explanations |
| `AnimatedTooltip` | team or contributor row |
| `FloatingDock` | mobile-only bottom navigation |
| `HoverEffect` | 3–4 short pillar cards |
| `Sparkles` | scan success / points milestone, once |
| `PointerHighlight` | one phrase in a paragraph |

`cn()` from `../lib/utils` merges classes. `useMotionSafe()` from `../lib/motion` gates motion.

## Layout

- Page width: `<Container>` (1200px). Section spacing: `py-16 sm:py-20`; hero `pt-28 pb-16` when under the fixed navbar.
- Cards: `rounded-card` (14px). Full-page panels: `rounded-panel` (20px). Buttons and tags: pill. Inputs: `rounded-field`.
- Page top: `PageHeader` with one `eyebrow`, one `display-1` title, one lead sentence, at most two actions.
- Every async surface needs loading, empty, and error states. Use `Skeleton`, `EmptyState`, inline `role="alert"` messages. No `alert()` in new code.
- Data surfaces (dashboards, results) are the priority: alignment, row rhythm, tabular numerals, sticky headers, no card-inside-card-inside-card.
- Mobile first: nothing may overflow horizontally. Long names truncate with `truncate` + `title`. Action rows wrap.
- Minimum touch target 40×40px. Icon-only controls need `aria-label`.

## Copy

Sound like a pharmacist explaining a price, not a startup pitch.

- **Do:** “Paracetamol 500 mg is ₹12 at Jan Aushadhi, 0.2 km away.”
- **Do:** “Stock confirmed 12 min ago.” “Call before you travel.”
- **Don't:** “Revolutionary AI-powered healthcare infrastructure.”
- **Don't:** “Seamless”, “effortless”, “unlock”, “empower”, “supercharge”, “cutting-edge”, “game-changing”, “#1”, “Built for Bharat”.
- Delete unverifiable claims: “10,000+ patients”, “4.9/5 accuracy”, “save up to 70%” unless the number comes from state already in the page.
- Prefer “pharmacy” over “dispensary” except for the proper name “Jan Aushadhi Kendra”.
- Hindi must be natural Hindi, not transliterated English. Keep both languages in sync.
- Buttons: verbs. “Compare prices”, not “Submit”.

## AI-slop checklist

Remove on sight: emoji, gradient text, neon glows, purple-on-purple everything, `rounded-3xl` on every box, pulsing dots used as decoration, five different badge colours in one row, fake live counters, `alert()`, duplicated inline SVG icons, copy that praises the product, cards with three nested borders, every section shouting in uppercase.

## Verify

```bash
cd medimap/frontend
node scripts/check-ui.mjs
```

It must print `No syntax or import errors.` Then re-read your own diff for: leftover `#hex`, `dark:` pairs on ordinary surfaces, unused imports, and English-only strings when the page is bilingual.
