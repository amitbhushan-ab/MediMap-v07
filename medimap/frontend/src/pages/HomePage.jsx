// src/pages/HomePage.jsx — the product's front door
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import {
  CAPABILITIES,
  HERO_PHRASES,
  LIVE_UPDATES,
  POPULAR_SEARCHES,
  STATS,
  STEPS,
} from '../lib/content';
import { formatPrice, pick } from '../lib/format';
import { EASE, fadeUp, stagger, viewport } from '../lib/motion';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Container, Section, SectionHeader } from '../components/ui/section';
import { Lamp } from '../components/ui/lamp';
import { HeroHighlight } from '../components/ui/hero-highlight';
import { FlipWords } from '../components/ui/flip-words';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { TypewriterEffect } from '../components/ui/typewriter-effect';
import { MovingBorderButton } from '../components/ui/moving-border';
import { PinContainer } from '../components/ui/pin';
import { BentoGrid, BentoGridItem } from '../components/ui/bento-grid';
import { InfiniteMovingCards } from '../components/ui/infinite-moving-cards';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { ScrollContainer } from '../components/ui/scroll-container';
import { DirectionHoverCard } from '../components/ui/direction-hover';
import { RoutePath } from '../components/ui/route-path';
import { MaskReveal } from '../components/ui/svg-mask-effect';
import { SpotlightBeams } from '../components/ui/spotlight-beams';
import { StarField } from '../components/ui/star-field';
import { NumberTicker } from '../components/ui/number-ticker';
import { GridPattern } from '../components/ui/grid-pattern';

const PREVIEW_ROWS = [
  { name: 'Jan Aushadhi Kendra', area: 'NSUT Gate 1', price: 12, distance: '0.2 km', lowest: true },
  { name: 'MedPlus', area: 'DDA Market, Sector 3', price: 18, distance: '0.4 km' },
  { name: 'Apollo Pharmacy', area: 'Sector 14 Metro', price: 25, distance: '1.1 km' },
];

const COPY = {
  eyebrow: {
    en: 'Dwarka pilot · prices published by pharmacies',
    hi: 'द्वारका पायलट · फार्मेसी द्वारा प्रकाशित कीमतें',
  },
  titleA: { en: 'The same medicine.', hi: 'वही दवा।' },
  titleB: { en: 'Find', hi: 'खोजें' },
  lead: {
    en: 'Compare what nearby pharmacies charge for the same strip, check whether it is in stock, and call the counter before you travel.',
    hi: 'आसपास की फार्मेसियों में उसी पत्ती की कीमत की तुलना करें, स्टॉक देखें, और निकलने से पहले काउंटर पर कॉल करें।',
  },
  popular: { en: 'Popular searches', hi: 'लोकप्रिय खोजें' },
  scan: { en: 'Scan a prescription', hi: 'पर्ची स्कैन करें' },
  map: { en: 'Open the map', hi: 'मैप खोलें' },
  trustA: { en: 'No account needed', hi: 'खाते की ज़रूरत नहीं' },
  trustB: { en: 'Hindi and English', hi: 'हिंदी और अंग्रेज़ी' },
  trustC: { en: 'Built in Dwarka', hi: 'द्वारका में बना' },
  preview: { en: 'Sample comparison', hi: 'नमूना तुलना' },
  perStrip: { en: 'per strip', hi: 'प्रति पत्ती' },
  lowest: { en: 'Lowest', hi: 'सबसे कम' },
  confirmed: { en: 'Stock confirmed 12 min ago', hi: 'स्टॉक 12 मिनट पहले पुष्ट' },
  allCounters: { en: 'See all counters', hi: 'सभी काउंटर देखें' },
  stats: { en: 'The pilot, in numbers', hi: 'पायलट, आंकड़ों में' },
  statsNote: {
    en: 'Counts come from the pilot index, not from a marketing deck.',
    hi: 'आंकड़े पायलट सूची से हैं, किसी प्रचार पन्ने से नहीं।',
  },
  feedEyebrow: { en: 'Recent stock updates', hi: 'हाल के स्टॉक अपडेट' },
  feedTitle: { en: 'What changed this week', hi: 'इस हफ़्ते क्या बदला' },
  feedBody: {
    en: 'Short updates from pharmacy counters in the pilot. Open the map to see all of them.',
    hi: 'पायलट में फार्मेसी काउंटरों से छोटे अपडेट। सभी देखने के लिए मैप खोलें।',
  },
  demoEyebrow: { en: 'Inside the product', hi: 'उत्पाद के अंदर' },
  demoTitle: { en: 'One search, then a decision', hi: 'एक खोज, फिर फ़ैसला' },
  demoBody: {
    en: 'The result page answers three questions in order: what it costs, whether it is there, and how far you have to go.',
    hi: 'परिणाम पेज तीन सवाल क्रम से जवाब देता है: कीमत क्या है, दवा है या नहीं, और कितनी दूर जाना है।',
  },
  demoSearch: { en: 'Paracetamol 500 mg', hi: 'पैरासिटामोल 500 मि.ग्रा.' },
  demoStock: { en: 'In stock', hi: 'उपलब्ध' },
  demoCall: { en: 'Call counter', hi: 'काउंटर पर कॉल' },
  demoFare: { en: 'Auto fare ₹0 · 0.2 km walk', hi: 'ऑटो किराया ₹0 · 0.2 किमी पैदल' },
  capabilitiesEyebrow: { en: 'What the product does', hi: 'उत्पाद क्या करता है' },
  capabilitiesTitle: { en: 'Built around the counter, not the ad', hi: 'काउंटर के लिए बना, विज्ञापन के लिए नहीं' },
  capabilitiesBody: {
    en: 'Five pieces that work together: search, stock, the walk-versus-fare decision, prescription reading, and a way to keep the data honest.',
    hi: 'पांच हिस्से जो साथ काम करते हैं: खोज, स्टॉक, पैदल बनाम किराया, पर्ची पढ़ना, और डेटा सही रखने का तरीका।',
  },
  aboutPilot: { en: 'How the pilot works', hi: 'पायलट कैसे काम करता है' },
  bridgeEyebrow: { en: 'Bridge mode', hi: 'ब्रिज मोड' },
  bridgeTitle: { en: 'The cheapest strip is not always the cheapest trip', hi: 'सबसे सस्ती पत्ती हमेशा सबसे सस्ती यात्रा नहीं' },
  bridgeBody: {
    en: 'Bridge adds the fare and the walk to the price you would pay, then ranks counters by what you actually spend.',
    hi: 'ब्रिज किराए और पैदल दूरी को कीमत में जोड़ता है, फिर काउंटर को आपके वास्तविक खर्च से क्रम में लगाता है।',
  },
  bridgeCta: { en: 'Open Bridge', hi: 'ब्रिज खोलें' },
  principlesEyebrow: { en: 'How this stays honest', hi: 'यह ईमानदार कैसे रहता है' },
  principlesA: {
    en: 'No sponsored counters. No commission on a search. A pharmacy cannot pay to rank above a lower price.',
    hi: 'कोई प्रायोजित काउंटर नहीं। खोज पर कोई कमीशन नहीं। कोई फार्मेसी कम कीमत से ऊपर आने के लिए भुगतान नहीं कर सकती।',
  },
  principlesB: {
    en: 'No sponsored counters. No commission on a search. A pharmacy cannot pay to rank above a lower price.',
    hi: 'कोई प्रायोजित काउंटर नहीं। खोज पर कोई कमीशन नहीं। कोई फार्मेसी कम कीमत से ऊपर आने के लिए भुगतान नहीं कर सकती।',
  },
  ctaTitle: { en: 'Check the price before you leave the house.', hi: 'घर से निकलने से पहले कीमत देखें।' },
  ctaBody: {
    en: 'Search a medicine in seconds, or scan the prescription you were given. Both work without signing in.',
    hi: 'सेकंडों में दवा खोजें, या अपनी पर्ची स्कैन करें। दोनों बिना साइन इन के काम करते हैं।',
  },
  searchCta: { en: 'Search a medicine', hi: 'दवा खोजें' },
  scanCta: { en: 'Scan a prescription', hi: 'पर्ची स्कैन करें' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);

  const t = (pair) => pick(lang, pair);
  const popular = POPULAR_SEARCHES.map((item) => item[lang] || item.en);

  function handleSearch(value = query) {
    const term = String(value || '').trim();
    if (!term) {
      inputRef.current?.focus();
      return;
    }
    navigate(`/results?q=${encodeURIComponent(term)}`);
  }

  function toggleListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      inputRef.current?.focus();
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setQuery(transcript);
        setIsListening(false);
        handleSearch(transcript);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  return (
    <div className="overflow-x-hidden bg-canvas">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pb-12 pt-28 sm:pb-16 sm:pt-32">
        <Lamp className="opacity-70 dark:opacity-100" width="46rem" height="26rem" />
        <HeroHighlight containerClassName="min-h-0" radius={260}>
          <Container className="relative z-10">
            <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
              <motion.div variants={stagger(0.04, 0.08)} initial="hidden" animate="show" className="min-w-0">
                <motion.div variants={fadeUp}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1.5 pr-3 text-[11px] font-medium text-ink-soft backdrop-blur-sm">
                    <span className="inline-flex h-5 items-center rounded-full bg-accent/10 px-2 text-[10px] uppercase tracking-[0.1em] text-accent-ink">
                      Pilot
                    </span>
                    {t(COPY.eyebrow)}
                  </span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="display-hero mt-6 text-ink">
                  <span className="block">{t(COPY.titleA)}</span>
                  <span className="mt-2 block">
                    {t(COPY.titleB)}{' '}
                    <FlipWords
                      words={HERO_PHRASES[lang] || HERO_PHRASES.en}
                      className="font-light"
                      duration={3000}
                    />
                  </span>
                </motion.h1>

                <motion.div variants={fadeUp} className="mt-7 sm:mt-8">
                  <TextGenerateEffect
                    words={t(COPY.lead)}
                    className="lead text-[15px] sm:text-base"
                    staggerDelay={0.012}
                  />
                </motion.div>

                <motion.form
                  variants={fadeUp}
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSearch();
                  }}
                  role="search"
                  className="mt-7 max-w-xl"
                >
                  <label htmlFor="home-search" className="sr-only">
                    Search for a medicine
                  </label>
                  <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1.5 pl-4 shadow-card transition-[border-color,box-shadow] duration-200 focus-within:border-accent/60 focus-within:shadow-lift">
                    <Search className="h-[18px] w-[18px] flex-shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                    <div className="relative min-w-0 flex-1">
                      {!query && (
                        <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-sm text-muted">
                          {focused || isListening ? (
                            <span>{isListening ? 'Listening…' : 'Type a brand or salt name'}</span>
                          ) : (
                            <TypewriterEffect
                              words={[
                                'Paracetamol 500mg',
                                'Azithromycin 500mg',
                                'Metformin 500mg',
                                'Cetirizine 10mg',
                              ]}
                            />
                          )}
                        </div>
                      )}
                      <input
                        ref={inputRef}
                        id="home-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        autoComplete="off"
                        className="h-9 w-full min-w-0 bg-transparent text-sm text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
                      />
                    </div>

                    <IconButton
                      size="sm"
                      onClick={toggleListening}
                      aria-label={isListening ? 'Stop voice search' : 'Search by voice'}
                      aria-pressed={isListening}
                      className={isListening ? 'bg-danger/10 text-danger' : 'text-muted'}
                    >
                      <Mic className="h-4 w-4" aria-hidden="true" />
                    </IconButton>

                    <Button type="submit" size="sm" className="flex-shrink-0 px-4">
                      Search
                    </Button>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                      {t(COPY.popular)}
                    </span>
                    {popular.map((medicine) => (
                      <button
                        key={medicine}
                        type="button"
                        onClick={() => handleSearch(medicine)}
                        className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent/40 hover:text-accent-ink"
                      >
                        {medicine}
                      </button>
                    ))}
                  </div>
                </motion.form>

                <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-2">
                  <MovingBorderButton
                    onClick={() => navigate('/scan')}
                    containerClassName="h-10"
                    className="h-full px-4"
                  >
                    <span>{t(COPY.scan)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </MovingBorderButton>
                  <Button variant="ghost" size="sm" to="/map" className="h-10 px-3 text-[13px]">
                    {t(COPY.map)}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    {t(COPY.trustA)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    {t(COPY.trustB)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    {t(COPY.trustC)}
                  </span>
                </motion.div>
              </motion.div>

              {/* Product preview */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                className="relative mx-auto w-full min-w-0 max-w-[440px] lg:max-w-none"
              >
                <div
                  aria-hidden="true"
                  className="absolute -inset-10 rounded-[36px] bg-[radial-gradient(ellipse_at_60%_25%,rgb(var(--accent)/0.22),transparent_62%)] blur-3xl"
                />
                <PinContainer to="/results?q=Paracetamol%20500mg" title={t(COPY.preview)}>
                  <div className="overflow-hidden rounded-panel">
                    <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                          {t(COPY.preview)}
                        </p>
                        <p className="mt-1 truncate text-[15px] font-medium text-ink">Paracetamol 500 mg</p>
                        <p className="mt-0.5 text-[11px] text-muted">10 tablets · generic available</p>
                      </div>
                      <span className="tnum rounded-full border border-accent/25 bg-accent/[0.07] px-2.5 py-1 text-[11px] font-medium text-accent-ink">
                        ₹12–25
                      </span>
                    </div>

                    <div className="divide-y divide-line">
                      {PREVIEW_ROWS.map((row, index) => (
                        <div
                          key={row.name}
                          className={`relative flex items-center justify-between gap-3 px-5 py-3.5 ${
                            row.lowest ? 'bg-accent/[0.035]' : ''
                          }`}
                        >
                          {row.lowest && (
                            <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-xs font-medium text-ink">{row.name}</p>
                              {row.lowest && (
                                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent-ink">
                                  {t(COPY.lowest)}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {row.area} · {row.distance}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`tnum text-sm font-medium ${row.lowest ? 'text-accent-ink' : 'text-ink'}`}>
                              {formatPrice(row.price)}
                            </p>
                            <p className="text-[10px] text-muted">{t(COPY.perStrip)}</p>
                          </div>
                          <div className="hidden w-14 sm:block" aria-hidden="true">
                            <span className="block h-1 overflow-hidden rounded-full bg-line">
                              <span
                                className={`block h-full rounded-full ${row.lowest ? 'bg-accent' : 'bg-line-strong'}`}
                                style={{ width: `${Math.round((row.price / 25) * 100)}%` }}
                              />
                            </span>
                            <span className="mt-1 block text-right text-[9px] text-muted">#{index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-line bg-raised/60 px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        {t(COPY.confirmed)}
                      </span>
                      <span className="link-quiet !text-[11px]">
                        {t(COPY.allCounters)}
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </PinContainer>

                <div className="pointer-events-none absolute -top-4 right-5 z-20 hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-lift sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium text-ink">Verified stock</span>
                  <span className="text-[10px] text-muted">12 min</span>
                </div>
              </motion.div>
            </div>
          </Container>
        </HeroHighlight>
      </section>

      {/* ── Pilot stats ──────────────────────────────────────── */}
      <section className="border-y border-line bg-raised/40">
        <Container>
          <div className="py-8 sm:py-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.stats)}
              </p>
              <p className="text-[11px] text-muted">{t(COPY.statsNote)}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-4">
              {STATS.map((stat, index) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
                  className="border-l border-line pl-4 first:border-l-0 first:pl-0 sm:pl-5"
                >
                  <StatNumber value={stat.value} />
                  <div className="mt-2 text-xs font-medium text-ink-soft">{t(stat.label)}</div>
                  <div className="mt-0.5 text-[11px] text-muted">{t(stat.detail)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Recent updates ───────────────────────────────────── */}
      <Section spacing="default">
        <Container>
          <SectionHeader
            eyebrow={t(COPY.feedEyebrow)}
            title={t(COPY.feedTitle)}
            description={t(COPY.feedBody)}
            action={
              <Button variant="secondary" size="sm" to="/map">
                {t(COPY.map)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          />
        </Container>
        <div className="mt-8">
          <InfiniteMovingCards
            items={LIVE_UPDATES}
            speed="slow"
            direction="left"
            renderItem={(item) => (
              <div className="flex h-full flex-col justify-between rounded-card border border-line bg-surface p-4 transition-colors duration-200 hover:border-accent/35">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="neutral">{pick(lang, item.tag)}</Badge>
                  <span className="tnum text-sm font-medium text-ink">{formatPrice(item.price)}</span>
                </div>
                <p className="mt-3 text-xs font-medium leading-relaxed text-ink">{item.note}</p>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                  <Store className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {item.pharmacy} · {item.area}
                  </span>
                </p>
              </div>
            )}
          />
        </div>
      </Section>

      {/* ── Inside the product ───────────────────────────────── */}
      <Section className="border-y border-line bg-raised/30">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.demoEyebrow)}
              </p>
              <h2 className="display-1 mt-3">{t(COPY.demoTitle)}</h2>
              <p className="lead mt-3 text-sm">{t(COPY.demoBody)}</p>

              <ol className="mt-7 space-y-5">
                {STEPS.map((step) => (
                  <li key={step.n} className="grid grid-cols-[30px_1fr] gap-3">
                    <span className="tnum text-[11px] font-medium leading-6 text-accent">{step.n}</span>
                    <div>
                      <h3 className="text-sm font-medium text-ink">{pick(lang, step.title)}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{pick(lang, step.body)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <ScrollContainer
              frameLabel="medimap.in/results?q=Paracetamol"
              title={
                <div className="text-center">
                  <p className="eyebrow justify-center">Dwarka · Sector 3</p>
                  <p className="mt-2 text-sm text-muted">
                    6 counters within 2 km · stock checked in the last hour
                  </p>
                </div>
              }
            >
              <div className="grid gap-0 sm:grid-cols-[1fr_240px]">
                <div className="border-b border-line sm:border-b-0 sm:border-r">
                  <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                    <Search className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    <span className="text-[11px] font-medium text-ink-soft">{t(COPY.demoSearch)}</span>
                    <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                      6 results
                    </span>
                  </div>
                  {PREVIEW_ROWS.map((row) => (
                    <div
                      key={row.name}
                      className={`flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 ${
                        row.lowest ? 'bg-accent/[0.04]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-ink">{row.name}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                          <span className="inline-flex items-center gap-1 text-success">
                            <span className="h-1 w-1 rounded-full bg-success" aria-hidden="true" />
                            {t(COPY.demoStock)}
                          </span>
                          · {row.distance}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tnum text-xs font-medium text-ink">{formatPrice(row.price)}</span>
                        <span className="hidden h-6 items-center gap-1 rounded-full border border-line px-2 text-[9px] text-muted sm:inline-flex">
                          {t(COPY.demoCall)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <aside className="bg-raised/50 p-4">
                  <p className="eyebrow !text-[9px]">Bridge estimate</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-field border border-line bg-surface p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted">Walk</span>
                        <span className="tnum text-xs font-medium text-ink">₹12</span>
                      </div>
                      <Ribbon tone="accent" width="38%" />
                    </div>
                    <div className="rounded-field border border-line bg-surface p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted">Auto + strip</span>
                        <span className="tnum text-xs font-medium text-ink">₹41</span>
                      </div>
                      <Ribbon tone="muted" width="92%" />
                    </div>
                    <p className="text-[10px] leading-relaxed text-muted">{t(COPY.demoFare)}</p>
                    <div className="flex items-center gap-1.5 rounded-field border border-success/25 bg-success/[0.06] p-2.5 text-[10px] text-success">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Best total ₹12 on foot
                    </div>
                  </div>
                </aside>
              </div>
            </ScrollContainer>
          </div>
        </Container>
      </Section>

      {/* ── Capabilities ─────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow={t(COPY.capabilitiesEyebrow)}
            title={t(COPY.capabilitiesTitle)}
            description={t(COPY.capabilitiesBody)}
            action={
              <Button variant="ghost" size="sm" to="/about">
                {t(COPY.aboutPilot)}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          />

          <BentoGrid className="mt-10 lg:grid-cols-6">
            <Link to="/results?q=Paracetamol%20500mg" className="group block h-full lg:col-span-4">
              <BentoGridItem
                className="h-full"
                badge={pick(lang, CAPABILITIES[0].tag)}
                title={pick(lang, CAPABILITIES[0].title)}
                description={pick(lang, CAPABILITIES[0].body)}
                header={<CompareVisual />}
                footer={
                  <>
                    <span className="text-[11px] text-muted">Paracetamol 500 mg · 6 counters</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                }
              />
            </Link>

            <Link to="/bridge" className="group block h-full lg:col-span-2">
              <BentoGridItem
                className="h-full"
                badge={pick(lang, CAPABILITIES[1].tag)}
                title={pick(lang, CAPABILITIES[1].title)}
                description={pick(lang, CAPABILITIES[1].body)}
                header={<BridgeVisual />}
                footer={
                  <>
                    <span className="text-[11px] text-muted">Fare and walk included</span>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </>
                }
              />
            </Link>

            <Link to="/scan" className="group block h-full lg:col-span-2">
              <BentoGridItem
                className="h-full"
                badge={pick(lang, CAPABILITIES[2].tag)}
                title={pick(lang, CAPABILITIES[2].title)}
                description={pick(lang, CAPABILITIES[2].body)}
                header={<ScanVisual />}
                footer={
                  <>
                    <span className="text-[11px] text-muted">On-device OCR</span>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </>
                }
              />
            </Link>

            <Link to="/map" className="group block h-full lg:col-span-2">
              <BentoGridItem
                className="h-full"
                badge={pick(lang, CAPABILITIES[3].tag)}
                title={pick(lang, CAPABILITIES[3].title)}
                description={pick(lang, CAPABILITIES[3].body)}
                header={<NetworkVisual />}
                footer={
                  <>
                    <span className="text-[11px] text-muted">Phone numbers included</span>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </>
                }
              />
            </Link>

            <Link to="/points" className="group block h-full lg:col-span-2">
              <BentoGridItem
                className="h-full"
                badge={pick(lang, CAPABILITIES[4].tag)}
                title={pick(lang, CAPABILITIES[4].title)}
                description={pick(lang, CAPABILITIES[4].body)}
                header={<PointsVisual />}
                footer={
                  <>
                    <span className="text-[11px] text-muted">20 points per receipt</span>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </>
                }
              />
            </Link>
          </BentoGrid>
        </Container>
      </Section>

      {/* ── Bridge teaser ────────────────────────────────────── */}
      <Section className="border-y border-line bg-raised/30">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14">
            <div>
              <p className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.bridgeEyebrow)}
              </p>
              <h2 className="display-1 mt-3">{t(COPY.bridgeTitle)}</h2>
              <p className="lead mt-3 text-sm">{t(COPY.bridgeBody)}</p>
              <Button variant="primary" size="sm" to="/bridge" className="mt-6">
                {t(COPY.bridgeCta)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>

            <DirectionHoverCard
              to="/bridge"
              className="p-5"
              overlay={
                <span className="flex items-center justify-between">
                  <span>Walk 0.2 km · fare ₹0</span>
                  <span className="tnum font-medium text-ink">₹12 total</span>
                </span>
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                  Route comparison
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                  <Wallet className="h-3 w-3" aria-hidden="true" />
                  fare + strip
                </span>
              </div>
              <RoutePath className="mt-2 h-[170px]" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-field border border-line bg-surface p-2.5">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-muted">Cheapest strip</p>
                  <p className="tnum mt-1 text-sm font-medium text-ink">₹12</p>
                  <p className="text-[10px] text-muted">0.2 km on foot</p>
                </div>
                <div className="rounded-field border border-accent/25 bg-accent/[0.05] p-2.5">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-accent-ink">Best total</p>
                  <p className="tnum mt-1 text-sm font-medium text-ink">₹12</p>
                  <p className="text-[10px] text-muted">no auto needed</p>
                </div>
              </div>
            </DirectionHoverCard>
          </div>
        </Container>
      </Section>

      {/* ── Principles ───────────────────────────────────────── */}
      <Section spacing="default">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr] lg:gap-14">
            <p className="eyebrow lg:pt-2">
              <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
              {t(COPY.principlesEyebrow)}
            </p>
            <MaskReveal
              className="text-xl leading-snug tracking-[-0.02em] sm:text-2xl"
              base={<p>{t(COPY.principlesA)}</p>}
              overlay={<p className="text-ink">{t(COPY.principlesB)}</p>}
            />
          </div>
        </Container>
      </Section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <Section spacing="tight" className="pb-20">
        <Container>
          <CardSpotlight className="relative overflow-hidden border-0 bg-navy p-0 text-white">
            <GridPattern className="text-white opacity-[0.06]" size={52} />
            <StarField className="opacity-70" count={40} />
            <SpotlightBeams opacity={0.35} tone="var(--accent-soft)" />
            <div className="relative z-10 grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                  MediMap · {t(COPY.trustC)}
                </p>
                <h2 className="display-2 mt-3 max-w-xl text-white">{t(COPY.ctaTitle)}</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">{t(COPY.ctaBody)}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  variant="secondary"
                  onClick={() => inputRef.current?.focus()}
                  className="w-full justify-between border-white/20 bg-white text-navy hover:bg-white/90 sm:w-auto lg:w-56"
                >
                  {t(COPY.searchCta)}
                  <Search className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  to="/scan"
                  className="w-full justify-between text-white hover:bg-white/10 hover:text-white sm:w-auto lg:w-56"
                >
                  {t(COPY.scanCta)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardSpotlight>
        </Container>
      </Section>
    </div>
  );
}

/* ── Small, hand-built previews used inside capability cards ── */

function StatNumber({ value }) {
  const match = String(value).match(/^([\d,.]+)(.*)$/);
  if (!match) return <div className="text-[1.65rem] font-light leading-none text-ink">{value}</div>;
  const numeric = Number(match[1].replace(/,/g, ''));
  return (
    <div className="text-[1.65rem] font-light leading-none tracking-[-0.03em] text-ink">
      <NumberTicker value={numeric} />
      <span className="text-[1.4rem]">{match[2]}</span>
    </div>
  );
}

function Ribbon({ tone = 'accent', width = '50%' }) {
  return (
    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
      <span
        className={`block h-full rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-line-strong'}`}
        style={{ width }}
      />
    </span>
  );
}

function CompareVisual() {
  return (
    <div className="space-y-1.5 p-3">
      {[
        { name: 'Jan Aushadhi', price: 12, km: '0.2 km' },
        { name: 'MedPlus', price: 18, km: '0.4 km' },
        { name: 'Apollo', price: 25, km: '1.1 km' },
      ].map((row, index) => (
        <div
          key={row.name}
          className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
            index === 0 ? 'bg-accent/10 text-accent-ink' : 'text-ink-soft'
          }`}
        >
          <span className="font-medium">{row.name}</span>
          <span className="flex items-center gap-3">
            <span className="text-muted">{row.km}</span>
            <span className="tnum font-medium">{formatPrice(row.price)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function BridgeVisual() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      <div className="rounded-md border border-line bg-surface p-2.5">
        <p className="text-[9px] uppercase tracking-wider text-muted">Cheapest</p>
        <p className="tnum mt-1 text-sm font-medium text-ink">₹12</p>
        <p className="text-[10px] text-muted">+ 0.2 km walk</p>
      </div>
      <div className="rounded-md border border-accent/25 bg-accent/[0.06] p-2.5">
        <p className="text-[9px] uppercase tracking-wider text-accent-ink">Best total</p>
        <p className="tnum mt-1 text-sm font-medium text-ink">₹17</p>
        <p className="text-[10px] text-muted">+ ₹0 fare</p>
      </div>
    </div>
  );
}

function ScanVisual() {
  return (
    <div className="space-y-2 p-3">
      {['Paracetamol 500 mg', 'Azithromycin 500 mg', 'Cetirizine 10 mg'].map((line, index) => (
        <div key={line} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
          <span className="text-[11px] text-ink-soft">{line}</span>
          <span className="ml-auto text-[9px] uppercase tracking-wider text-muted">{index === 0 ? '1-0-1' : '—'}</span>
        </div>
      ))}
    </div>
  );
}

function NetworkVisual() {
  return (
    <div className="relative h-[92px] p-3">
      <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative flex h-full items-center justify-center gap-6">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`flex h-8 w-8 items-center justify-center rounded-full border ${
              index === 1 ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-surface text-muted'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}

function PointsVisual() {
  return (
    <div className="p-4">
      <div className="flex items-end justify-between">
        <span className="tnum text-lg font-light text-ink">240</span>
        <span className="text-[10px] text-muted">of 300 to next tier</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full w-4/5 rounded-full bg-accent" />
      </div>
      <p className="mt-2 text-[10px] text-muted">Voucher MEDI20 · 20% off</p>
    </div>
  );
}
