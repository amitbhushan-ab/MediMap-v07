// frontend/src/pages/AboutPage.jsx — what the pilot is, what it measures, and who runs it
import {
  ArrowRight,
  ArrowUpRight,
  EyeOff,
  HandCoins,
  Languages,
  ReceiptText,
  ScanLine,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { STATS } from '../lib/content';
import { formatPrice, initials, pick } from '../lib/format';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Container, Section, SectionHeader, Stat } from '../components/ui/section';
import { BackgroundBeams } from '../components/ui/background-beams';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { GridPattern } from '../components/ui/grid-pattern';
import { Lamp } from '../components/ui/lamp';
import { SpotlightBeams } from '../components/ui/spotlight-beams';
import { StarField } from '../components/ui/star-field';
import { HoverEffect } from '../components/ui/card-hover-effect';
import { StickyScrollReveal } from '../components/ui/sticky-scroll-reveal';
import { Timeline } from '../components/ui/timeline';

const COPY = {
  eyebrow: { en: 'About MediMap', hi: 'MediMap के बारे में' },
  heroBefore: { en: 'The same strip costs', hi: 'वही पत्ती एक काउंटर पर' },
  heroBetween: { en: 'at one counter and', hi: 'की है और कुछ मिनट दूर दूसरे काउंटर पर' },
  heroAfter: {
    en: 'a few minutes away. Neither price is visible until you are at the counter.',
    hi: 'की। दोनों में से कोई भी कीमत काउंटर पर पहुँचने तक पता नहीं चलती।',
  },
  lead: {
    en: 'MediMap is a price and stock index for pharmacies in Dwarka, Delhi. Counters publish what they have and what they charge; you check both before leaving home.',
    hi: 'MediMap द्वारका, दिल्ली की फार्मेसियों के लिए कीमत और स्टॉक का सूचकांक है। काउंटर बताते हैं कि क्या रखा है और कितने में; आप घर से निकलने से पहले दोनों देख लेते हैं।',
  },
  bridge: { en: 'Open Bridge', hi: 'ब्रिज खोलें' },
  map: { en: 'See the map', hi: 'मैप देखें' },
  scan: { en: 'Scan a prescription', hi: 'पर्ची स्कैन करें' },

  statsEyebrow: { en: 'Pilot measurements', hi: 'पायलट के आँकड़े' },
  statsNote: {
    en: 'From pharmacy submissions in Dwarka and Delhi NCR. These are pilot figures, not a national claim.',
    hi: 'द्वारका और दिल्ली एनसीआर की फार्मेसियों से मिले आँकड़े। ये पायलट के आँकड़े हैं, पूरे देश के लिए दावा नहीं।',
  },

  whyEyebrow: { en: 'What decides trust', hi: 'भरोसा किस पर टिका है' },
  whyTitle: { en: 'Why MediMap exists', hi: 'MediMap क्यों ज़रूरी है' },
  whyBody: {
    en: 'Four things decide whether a price comparison can be trusted: whether the price is visible, who is paid to rank it, what backs it up, and whether it is readable in the language you use.',
    hi: 'कीमत की तुलना पर भरोसा चार बातों से तय होता है: कीमत दिखती है या नहीं, क्रम तय करने के लिए किसी को पैसा मिलता है या नहीं, उसके पीछे क्या सबूत है, और वह आपकी भाषा में पढ़ी जा सकती है या नहीं।',
  },

  pilotEyebrow: { en: 'Mechanics', hi: 'काम करने का तरीका' },
  pilotTitle: { en: 'How the pilot works', hi: 'पायलट कैसे काम करता है' },
  pilotBody: {
    en: 'Four steps, all visible to the patient: what the counter entered, what you searched, what the trip adds, and what a bill changes.',
    hi: 'चार कदम, सब मरीज़ के सामने: काउंटर ने क्या दर्ज किया, आपने क्या खोजा, सफ़र कितना जोड़ता है, और बिल आने पर क्या बदलता है।',
  },

  journeyEyebrow: { en: 'Journey', hi: 'सफ़र' },
  journeyTitle: { en: 'How the pilot got here', hi: 'पायलट यहाँ तक कैसे पहुँचा' },
  journeyBody: {
    en: 'Three years: prices collected by hand first, then entered by the pharmacies themselves.',
    hi: 'तीन साल: पहले कीमतें हाथ से जुटाई गईं, फिर फार्मेसियों ने खुद दर्ज कीं।',
  },

  teamEyebrow: { en: 'Team', hi: 'टीम' },
  teamTitle: { en: 'Who runs the pilot', hi: 'पायलट कौन चलाता है' },
  teamBody: {
    en: 'Each person owns one part of the index: the counters, the code, the checks, and the screens.',
    hi: 'हर व्यक्ति सूचकांक का एक हिस्सा संभालता है: काउंटर, कोड, जाँच और स्क्रीन।',
  },

  ctaTag: { en: 'MediMap · Dwarka, Delhi', hi: 'MediMap · द्वारका, दिल्ली' },
  ctaTitle: {
    en: 'Check the price before you leave the house.',
    hi: 'घर से निकलने से पहले कीमत देख लें।',
  },
  ctaBody: {
    en: 'Bridge adds the fare and the walk to the price. If you already have a prescription, scan it and compare every line at once.',
    hi: 'ब्रिज कीमत में किराया और पैदल दूरी जोड़ता है। पर्ची पहले से है तो उसे स्कैन करें और हर पंक्ति की तुलना एक साथ करें।',
  },
};

const PILLARS = [
  {
    badge: { en: 'Pillar 01', hi: 'स्तंभ 01' },
    meta: '01',
    icon: <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
    title: { en: 'Prices are not public', hi: 'कीमतें सार्वजनिक नहीं हैं' },
    description: {
      en: 'Nothing on a shopfront says what a strip costs. The index stores the price a pharmacist submits, the pack size it applies to, and the time it was last saved.',
      hi: 'दुकान के बाहर कहीं नहीं लिखा होता कि पत्ती कितने की है। सूचकांक वह कीमत रखता है जो फार्मासिस्ट भेजता है, उसका पैक साइज़, और आखिरी बार सहेजे जाने का समय।',
    },
  },
  {
    badge: { en: 'Pillar 02', hi: 'स्तंभ 02' },
    meta: '02',
    icon: <HandCoins className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
    title: { en: 'No commission on ranking', hi: 'क्रम पर कोई कमीशन नहीं' },
    description: {
      en: 'MediMap is not paid when you buy. The list is ordered by price, distance and stock, so the first counter is the cheaper one, not the one that paid for the position.',
      hi: 'आपकी खरीद पर MediMap को कुछ नहीं मिलता। सूची कीमत, दूरी और स्टॉक से लगती है, इसलिए सबसे ऊपर वही काउंटर आता है जो सस्ता है, वह नहीं जिसने जगह के पैसे दिए।',
    },
  },
  {
    badge: { en: 'Pillar 03', hi: 'स्तंभ 03' },
    meta: '03',
    icon: <ReceiptText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
    title: { en: 'A bill is the check', hi: 'बिल ही जाँच है' },
    description: {
      en: 'A price is marked verified only when a printed bill from that counter matches it. Until a receipt arrives, the price stays labelled as reported by the pharmacist.',
      hi: 'कीमत तभी सत्यापित मानी जाती है जब उसी काउंटर का छपा हुआ बिल उससे मिलता हो। जब तक रसीद न आए, वह कीमत फार्मासिस्ट द्वारा बताई गई ही मानी जाती है।',
    },
  },
  {
    badge: { en: 'Pillar 04', hi: 'स्तंभ 04' },
    meta: '04',
    icon: <Languages className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
    title: { en: 'Both languages, every screen', hi: 'दोनों भाषाएँ, हर स्क्रीन' },
    description: {
      en: 'Headings, price notes, prescription lines and error messages are written in Hindi and English. Switching the language does not leave half the page in English.',
      hi: 'शीर्षक, कीमत की टिप्पणियाँ, पर्ची की पंक्तियाँ और गलती के संदेश हिंदी और अंग्रेज़ी दोनों में लिखे जाते हैं। भाषा बदलने पर आधा पेज अंग्रेज़ी में नहीं छूटता।',
    },
  },
];

const PILOT_STEPS = [
  {
    title: { en: 'The pharmacy publishes', hi: 'फार्मेसी स्टॉक बताती है' },
    summary: { en: 'Pack size, price and shelf count, with a timestamp.', hi: 'पैक, कीमत और स्टॉक, समय के साथ।' },
    description: {
      en: 'A pharmacist enters the pack size, the price and how many strips are on the shelf, then edits the entry when the shelf changes. Every entry carries the time it was saved.',
      hi: 'फार्मासिस्ट पैक साइज़, कीमत और शेल्फ पर रखी पत्तियों की संख्या भरता है, और शेल्फ बदलने पर प्रविष्टि बदल देता है। हर प्रविष्टि के साथ वह समय जुड़ा रहता है जब उसे सहेजा गया।',
    },
  },
  {
    title: { en: 'You search', hi: 'आप खोजते हैं' },
    summary: { en: 'Brand, salt name, or a photo of the prescription.', hi: 'ब्रांड, सॉल्ट नाम, या पर्ची की फ़ोटो।' },
    description: {
      en: 'Type a brand or salt name, or upload the prescription. Results show the price per strip, the distance and the time of the last stock update.',
      hi: 'ब्रांड या सॉल्ट नाम लिखें, या पर्ची अपलोड करें। नतीजों में प्रति पत्ती कीमत, दूरी और आखिरी स्टॉक अपडेट का समय दिखता है।',
    },
  },
  {
    title: { en: 'Bridge adds the trip', hi: 'ब्रिज सफ़र जोड़ता है' },
    summary: {
      en: 'Fare and walking time are added before ranking.',
      hi: 'क्रम से पहले किराया और पैदल दूरी जोड़ी जाती है।',
    },
    description: {
      en: 'Bridge adds the auto fare or the walking time to the price and ranks by total cost. A saving that needs a longer ride is shown as the worse option.',
      hi: 'ब्रिज ऑटो का किराया या पैदल का समय कीमत में जोड़कर कुल खर्च से क्रम लगाता है। जिस बचत के लिए लंबा सफ़र करना पड़े, वह कमतर विकल्प दिखता है।',
    },
  },
  {
    title: { en: 'A receipt earns points', hi: 'रसीद पर अंक मिलते हैं' },
    summary: {
      en: 'A matching bill verifies the price and adds 20 points.',
      hi: 'मिलता हुआ बिल कीमत सत्यापित करता है और 20 अंक जोड़ता है।',
    },
    description: {
      en: 'After you buy, upload the printed bill. If it matches the listed price, the listing is marked verified and the contribution earns 20 points; a mismatch sends it for review.',
      hi: 'खरीदने के बाद छपा हुआ बिल अपलोड करें। अगर वह सूची में दी कीमत से मिलता है, तो लिस्टिंग सत्यापित हो जाती है और योगदान पर 20 अंक मिलते हैं; मेल न खाने पर वह जाँच के लिए भेजी जाती है।',
    },
  },
];

const MILESTONES = [
  {
    year: '2024',
    title: { en: 'Bills collected in Dwarka', hi: 'द्वारका में बिल जुटाए गए' },
    description: {
      en: 'Volunteers collected printed bills around Sector 3 and Dwarka Mor. The same formulation showed up at up to three times the price within walking distance.',
      hi: 'स्वयंसेवकों ने सेक्टर 3 और द्वारका मोड़ के आसपास छपे हुए बिल जुटाए। पैदल दूरी के भीतर ही वही दवा तीन गुना तक कीमत पर मिली।',
    },
  },
  {
    year: '2025',
    title: { en: 'Fifty counters publish prices', hi: 'पचास काउंटर कीमतें बताने लगे' },
    description: {
      en: 'Fifty independent pharmacies in Dwarka and Delhi NCR began publishing stock and prices from the portal. The index still reads the same three fields.',
      hi: 'द्वारका और दिल्ली एनसीआर की पचास स्वतंत्र फार्मेसियों ने पोर्टल से स्टॉक और कीमतें देना शुरू किया। सूचकांक आज भी वही तीन फ़ील्ड पढ़ता है।',
    },
  },
  {
    year: '2026',
    title: { en: 'Bridge mode and prescription scan', hi: 'ब्रिज मोड और पर्ची स्कैन' },
    description: {
      en: 'Bridge ranks counters by total cost rather than sticker price. Prescription scanning and receipt verification shipped in the same release.',
      hi: 'ब्रिज काउंटरों का क्रम दुकान के दाम से नहीं, कुल खर्च से लगाता है। पर्ची स्कैन और रसीद सत्यापन उसी रिलीज़ में आए।',
    },
  },
];

const TEAM = [
  {
    name: 'Amit Bhushan',
    role: { en: 'Founder', hi: 'संस्थापक' },
    duty: {
      en: 'Sets the pilot scope and handles pharmacy relationships in Dwarka.',
      hi: 'पायलट का दायरा तय करते हैं और द्वारका में फार्मेसियों से संपर्क संभालते हैं।',
    },
  },
  {
    name: 'Dhanveen Mehta',
    role: { en: 'Head of Technology & CTO', hi: 'तकनीकी प्रमुख और सीटीओ' },
    duty: {
      en: 'Maintains the price index, search, and the prescription parser.',
      hi: 'कीमत सूचकांक, खोज और पर्ची पार्सर संभालते हैं।',
    },
  },
  {
    name: 'Mayank Bedi',
    role: { en: 'Operations Lead & COO', hi: 'संचालन प्रमुख और सीओओ' },
    duty: {
      en: 'Runs counter onboarding and checks submitted stock against the shelf.',
      hi: 'काउंटर जोड़ने का काम चलाते हैं और भेजा गया स्टॉक शेल्फ से मिलाते हैं।',
    },
  },
  {
    name: 'Parul Singh',
    role: { en: 'Design Lead & CEO', hi: 'डिजाइन प्रमुख और सीईओ' },
    duty: {
      en: 'Designs the patient and pharmacist screens in both languages.',
      hi: 'मरीज़ और फार्मासिस्ट की स्क्रीन दोनों भाषाओं में डिज़ाइन करती हैं।',
    },
  },
];

export default function AboutPage() {
  const { lang } = useLang();
  const t = (pair) => pick(lang, pair);

  return (
    <div className="bg-canvas">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <div className="mesh-atmosphere">
          <BackgroundBeams className="opacity-30" opacity={0.4} />
          <Lamp width="38rem" height="16rem" className="opacity-70" />
          <Container className="relative z-10 pb-14 pt-10 sm:pb-20 sm:pt-16">
            <div className="max-w-3xl">
              <div className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.eyebrow)}
              </div>

              <h1 className="display-1 mt-4 text-ink">
                {t(COPY.heroBefore)} <span className="tnum">{formatPrice(12)}</span>{' '}
                {t(COPY.heroBetween)} <span className="tnum">{formatPrice(25)}</span> {t(COPY.heroAfter)}
              </h1>

              <p className="lead mt-5 text-[15px]">{t(COPY.lead)}</p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <Button to="/bridge">
                  {t(COPY.bridge)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button variant="secondary" to="/map">
                  {t(COPY.map)}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Pilot stats */}
      <Section spacing="tight" className="border-b border-line">
        <Container>
          <p className="eyebrow mb-5">
            <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
            {t(COPY.statsEyebrow)}
          </p>

          <div className="overflow-hidden rounded-panel border border-line bg-surface">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {STATS.map((stat, index) => (
                <div
                  key={stat.value}
                  className={cn(
                    'min-w-0 p-4 sm:p-5',
                    index % 2 === 1 && 'border-l border-line',
                    index >= 2 && 'border-t border-line sm:border-t-0',
                    index === 2 && 'sm:border-l',
                  )}
                >
                  <Stat value={stat.value} label={t(stat.label)} detail={t(stat.detail)} />
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-muted">{t(COPY.statsNote)}</p>
        </Container>
      </Section>

      {/* Why MediMap exists */}
      <Section className="border-b border-line bg-raised/30">
        <Container>
          <SectionHeader
            eyebrow={t(COPY.whyEyebrow)}
            title={t(COPY.whyTitle)}
            description={t(COPY.whyBody)}
          />
          <HoverEffect
            className="mt-8"
            items={PILLARS.map((pillar) => ({
              badge: t(pillar.badge),
              meta: pillar.meta,
              icon: pillar.icon,
              title: t(pillar.title),
              description: t(pillar.description),
            }))}
          />
        </Container>
      </Section>

      {/* How the pilot works */}
      <Section className="border-b border-line">
        <Container>
          <SectionHeader
            eyebrow={t(COPY.pilotEyebrow)}
            title={t(COPY.pilotTitle)}
            description={t(COPY.pilotBody)}
          />
          <StickyScrollReveal
            className="mt-10"
            items={PILOT_STEPS.map((step) => ({
              title: t(step.title),
              summary: t(step.summary),
              description: t(step.description),
            }))}
          />
        </Container>
      </Section>

      {/* Journey */}
      <Section className="border-b border-line bg-raised/30">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.journeyEyebrow)}
              </p>
              <h2 className="display-1 mt-3 text-ink">{t(COPY.journeyTitle)}</h2>
              <p className="lead mt-3 text-sm">{t(COPY.journeyBody)}</p>
            </div>

            <Timeline
              items={MILESTONES.map((milestone) => ({
                year: milestone.year,
                title: t(milestone.title),
                description: t(milestone.description),
              }))}
            />
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section className="border-b border-line">
        <Container>
          <SectionHeader
            eyebrow={t(COPY.teamEyebrow)}
            title={t(COPY.teamTitle)}
            description={t(COPY.teamBody)}
          />

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <CardSpotlight key={member.name} className="flex h-full flex-col p-5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-[11px] font-medium tracking-[0.04em] text-accent-ink"
                  aria-hidden="true"
                >
                  {initials(member.name)}
                </span>
                <h3 className="mt-4 text-sm font-medium tracking-[-0.015em] text-ink">{member.name}</h3>
                <p className="mt-0.5 text-[11px] font-medium text-accent-ink">{t(member.role)}</p>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{t(member.duty)}</p>
              </CardSpotlight>
            ))}
          </div>
        </Container>
      </Section>

      {/* Closing CTA */}
      <Section className="pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-panel bg-navy px-6 py-8 text-white sm:px-10 sm:py-10">
            <GridPattern className="text-white opacity-[0.06]" />
            <StarField className="opacity-70" count={36} />
            <SpotlightBeams opacity={0.32} tone="var(--accent-soft)" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="eyebrow text-white/55">{t(COPY.ctaTag)}</p>
                <h2 className="display-2 mt-3 max-w-xl text-white">{t(COPY.ctaTitle)}</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">{t(COPY.ctaBody)}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  to="/bridge"
                  className="w-full justify-between bg-white text-navy hover:bg-white/90 sm:w-auto lg:w-56"
                >
                  {t(COPY.bridge)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  to="/scan"
                  className="w-full justify-between text-white hover:bg-white/10 hover:text-white sm:w-auto lg:w-56"
                >
                  {t(COPY.scan)}
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
