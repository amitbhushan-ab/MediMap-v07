// frontend/src/pages/AdminPage.jsx — MediMap super-admin control centre
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { EmptyState } from '../components/ui/empty-state';
import { Field, Input, Select, Textarea } from '../components/ui/input';
import { Lamp } from '../components/ui/lamp';
import { Modal } from '../components/ui/modal';
import { NumberTicker } from '../components/ui/number-ticker';
import { Progress } from '../components/ui/progress';
import { ShimmerButton } from '../components/ui/shimmer-button';
import { Spotlight } from '../components/ui/spotlight';
import { GridPattern } from '../components/ui/grid-pattern';
import { SegmentedControl, Tabs } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';

const ADMIN_KEY = 'admin123';

// ── Vector micro-icons — no emoji, no icon-font weight ─────────────
const Icons = {
  Shield: () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Submissions: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Pharmacy: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Points: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Coupons: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Broadcast: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Check: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Close: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Search: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  External: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3600);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-4 z-[130] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-white/10 bg-navy px-4 py-2.5 text-xs font-medium text-white shadow-float sm:right-6"
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', type === 'error' ? 'bg-danger' : 'bg-success')}
      />
      <span className="truncate">{msg}</span>
      <IconButton
        size="xs"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="-mr-1 text-white/55 hover:bg-white/10 hover:text-white"
      >
        <Icons.Close />
      </IconButton>
    </motion.div>
  );
}

// ── Demo dataset (no live admin API is wired yet) ──────────────────
const INITIAL_STATS = {
  pending: 3,
  pharmacists: 8,
  premiumPharmacists: 3,
  newPharmacy: 1,
  totalAudits: 142,
  pointsDistributed: 2840,
};

const INITIAL_SUBMISSIONS = [
  {
    _id: 'sub_1',
    medicineName: 'Paracetamol 500mg',
    price: 18.0,
    pharmacyNameSnapshot: 'Apollo Pharmacy — Sector 14 Dwarka',
    submittedBy: { userName: 'Kunal Verma', email: 'kunal.v@nsut.ac.in' },
    status: 'pending',
    isNewPharmacy: false,
    personalNote: 'Bought 1 strip at NSUT Gate 1 Apollo, verified on counter receipt.',
    billImage: { url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&fit=crop' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'sub_2',
    medicineName: 'Metformin 500mg (Generic SR)',
    price: 24.5,
    pharmacyNameSnapshot: 'Jan Aushadhi Kendra — NSUT Commercial',
    submittedBy: { userName: 'Priya Sharma', email: 'priya.s@gmail.com' },
    status: 'pending',
    isNewPharmacy: false,
    personalNote: 'Govt Jan Aushadhi generic rate confirmed.',
    billImage: { url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&fit=crop' },
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    _id: 'sub_3',
    medicineName: 'Amoxicillin 500mg Capsule',
    price: 68.0,
    pharmacyNameSnapshot: 'HealthPlus Pharmacy — Kakrola',
    submittedBy: { userName: 'Aman Deep', email: 'aman.nsut@gmail.com' },
    status: 'pending',
    isNewPharmacy: true,
    newPharmacyData: { name: 'HealthPlus Pharmacy', address: 'Plot 4, Kakrola Road near Metro Pillar 782' },
    personalNote: 'New medical store opened near Kakrola More.',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const INITIAL_PHARMACISTS = [
  { _id: 'ph_1', name: 'Jan Aushadhi Kendra — NSUT Gate 1', address: 'Commercial Complex, Sector 3, Dwarka', contact: '011-25099021', email: 'janaushadhi.nsut@gov.in', isListed: true, isVerified: true, isFeatured: true, isPremium: true, isSuspended: false },
  { _id: 'ph_2', name: 'Apollo Pharmacy — Sector 14 Dwarka', address: 'Near Metro Station, Sector 14, Dwarka', contact: '011-25081144', email: 'apollo.dwk14@apollo.com', isListed: true, isVerified: true, isFeatured: true, isPremium: true, isSuspended: false },
  { _id: 'ph_3', name: 'MedPlus Pharmacy — Sector 3 Dwarka', address: 'Shop 12, DDA Market, Sector 3', contact: '011-25076611', email: 'dwarka.sec3@medplus.in', isListed: true, isVerified: true, isFeatured: false, isPremium: false, isSuspended: false },
  { _id: 'ph_4', name: 'Frank Ross Pharmacy — Sector 12 Dwarka', address: 'Central Market, Sector 12 Dwarka', contact: '011-28034455', email: 'frankross.sec12@frankross.in', isListed: true, isVerified: true, isFeatured: false, isPremium: false, isSuspended: false },
  { _id: 'ph_5', name: 'Aggarwal Medicos — Kakrola More', address: 'Shop 4, Main Road, Kakrola', contact: '9811223344', email: 'aggarwal.medicos@gmail.com', isListed: true, isVerified: false, isFeatured: false, isPremium: false, isSuspended: false },
  { _id: 'ph_6', name: 'Wellness Forever — Janakpuri West', address: 'Block C4E, Janakpuri', contact: '011-45678900', email: 'janakpuri@wellnessforever.in', isListed: true, isVerified: true, isFeatured: false, isPremium: true, isSuspended: false },
];

const INITIAL_COUPONS = [
  { _id: 'c_1', code: 'MEDI20', discount: 20, isUsed: false, expiresAt: new Date(Date.now() + 86400000 * 24).toISOString(), isAdminCoupon: true },
  { _id: 'c_2', code: 'NSUTCAMPUS50', discount: 50, isUsed: false, expiresAt: new Date(Date.now() + 86400000 * 12).toISOString(), isAdminCoupon: true },
  { _id: 'c_3', code: 'WELCOME10', discount: 10, isUsed: true, expiresAt: new Date(Date.now() - 86400000 * 3).toISOString(), isAdminCoupon: true },
];

const INITIAL_BROADCASTS = [
  { _id: 'b_1', title: 'NSUT Dwarka micro-hub active', message: 'All Jan Aushadhi and Apollo inventory indices calibrated with zero markup.', type: 'info', target: 'all', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'b_2', title: 'Monsoon stock alert: paracetamol and ORS', message: 'Priority inventory monitoring enabled for hydration formulas and analgesic essentials.', type: 'alert', target: 'pharmacists', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

// Field hands back `{ id, describedBy, invalid }`; only real DOM props may be spread.
const fieldProps = ({ id, describedBy }) => ({ id, 'aria-describedby': describedBy });

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

// ══════════════════════════════════════════════════════════════════
// 1. Analytics
// ══════════════════════════════════════════════════════════════════
function AnalyticsTab({ stats }) {
  const cards = [
    { label: 'Pending price audits', value: stats.pending, tone: 'warning', detail: 'Awaiting receipt verification', meta: '+2 today' },
    { label: 'Listed dispensaries', value: stats.pharmacists, tone: 'accent', detail: 'Active across Dwarka and NCR', meta: 'All active' },
    { label: 'Premium dispensaries', value: stats.premiumPharmacists, tone: 'success', detail: 'Live inventory API sync', meta: 'Calibrated' },
    { label: 'New registrations', value: stats.newPharmacy, tone: 'danger', detail: 'Awaiting credential check', meta: '1 in review' },
  ];

  const health = [
    { label: 'Stock-index accuracy', value: 99.2, tone: 'success' },
    { label: 'Bill verification coverage', value: 86, tone: 'accent' },
    { label: 'Dispensary API uptime', value: 97, tone: 'success' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <CardSpotlight key={card.label} className="flex flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-muted">{card.label}</span>
              <Badge tone={card.tone} dot>
                {card.meta}
              </Badge>
            </div>
            <div className="mt-3 text-[2rem] font-light leading-none tracking-[-0.04em] text-ink">
              <NumberTicker value={card.value} />
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">{card.detail}</p>
          </CardSpotlight>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardSpotlight className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="eyebrow">
              <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
              System topology
            </span>
            <Badge tone="success" dot>
              38 ms latency
            </Badge>
          </div>

          <h3 className="display-3 mt-3 text-ink">MediMap transparency engine</h3>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
            Cross-verifies crowd-sourced bill submissions against NPPA ceiling schedules and live dispensary
            inventories across Dwarka sectors 3, 12, 14 and the NSUT campus.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {health.map((row) => (
              <div key={row.label}>
                <Progress value={row.value} tone={row.tone} label={row.label} />
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Total audits</span>
              <div className="mt-1 text-xl font-light text-ink">
                <NumberTicker value={stats.totalAudits || 142} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Community points</span>
              <div className="mt-1 text-xl font-light text-accent-ink">
                <NumberTicker value={stats.pointsDistributed || 2840} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Accuracy</span>
              <div className="mt-1 text-xl font-light text-success">
                <NumberTicker value={99.2} decimals={1} suffix="%" />
              </div>
            </div>
          </div>
        </CardSpotlight>

        <Card className="flex flex-col justify-between p-5">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Quick actions</span>
            <div className="mt-3 space-y-2">
              {[
                { to: '/bridge', label: 'Audit bridge engine' },
                { to: '/map', label: 'Dwarka geolocation map' },
                { to: '/points', label: 'MediPoints rewards' },
              ].map((action) => (
                <Button key={action.to} to={action.to} variant="secondary" size="sm" className="w-full justify-between">
                  <span>{action.label}</span>
                  <Icons.External />
                </Button>
              ))}
            </div>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
            Logged as administrator · full permissions
          </p>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. Price audits
// ══════════════════════════════════════════════════════════════════
function SubmissionsTab({ submissions, onApprove, onReject }) {
  const [filter, setFilter] = useState('pending');
  const [billUrl, setBillUrl] = useState(null);

  const filtered = submissions.filter((submission) =>
    filter === 'all' ? true : submission.status === filter,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} label="Filter submissions" />
        <span className="text-xs text-muted">
          <span className="tnum">{filtered.length}</span> in queue
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${filter === 'all' ? '' : filter} submissions`}
          description="New bill proofs land here the moment a member submits a price."
          icon={Icons.Submissions}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((submission) => {
            const isPending = submission.status === 'pending';
            return (
              <Card key={submission._id} hover className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{submission.medicineName}</span>
                      <Badge tone="accent">
                        ₹{Number(submission.price).toFixed(2)}
                      </Badge>
                      {submission.status === 'pending' && <Badge tone="warning">Pending audit</Badge>}
                      {submission.status === 'approved' && <Badge tone="success">Approved · +20 pts</Badge>}
                      {submission.status === 'rejected' && <Badge tone="danger">Rejected</Badge>}
                      {submission.isNewPharmacy && <Badge tone="outline">New pharmacy</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span>
                        Dispensary <strong className="font-medium text-ink-soft">{submission.pharmacyNameSnapshot}</strong>
                      </span>
                      <span>
                        By {submission.submittedBy?.userName || 'Member'}
                        {submission.submittedBy?.email ? ` · ${submission.submittedBy.email}` : ''}
                      </span>
                      <span className="tnum">{new Date(submission.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {submission.personalNote && (
                      <p className="rounded-field border border-line bg-raised px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
                        “{submission.personalNote}”
                      </p>
                    )}

                    {submission.isNewPharmacy && submission.newPharmacyData && (
                      <Card tone="cream" className="px-3 py-2 text-[11px] leading-relaxed">
                        <strong className="font-medium">Proposed new store</strong> — {submission.newPharmacyData.name},{' '}
                        {submission.newPharmacyData.address}
                      </Card>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    {submission.billImage?.url && (
                      <Button size="xs" variant="secondary" onClick={() => setBillUrl(submission.billImage.url)}>
                        {submission.medicineName}'s bill
                      </Button>
                    )}
                    {isPending && (
                      <>
                        <Button size="xs" variant="primary" onClick={() => onApprove(submission._id)}>
                          <Icons.Check />
                          Approve · +20
                        </Button>
                        <Button size="xs" variant="secondary" onClick={() => onReject(submission._id)}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(billUrl)}
        onClose={() => setBillUrl(null)}
        title="Uploaded bill proof"
        description="Receipt supplied by the member who submitted this price."
        size="lg"
        footer={
          <Button size="sm" variant="secondary" onClick={() => setBillUrl(null)}>
            Close
          </Button>
        }
      >
        {billUrl && (
          <img
            src={billUrl}
            alt="Bill proof"
            className="max-h-[62vh] w-full rounded-field border border-line object-contain"
          />
        )}
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. Dispensaries
// ══════════════════════════════════════════════════════════════════
function PharmacistsTab({ pharmacists, onToggle, toast }) {
  const [search, setSearch] = useState('');
  const [messageFor, setMessageFor] = useState(null);
  const [messageText, setMessageText] = useState('');

  const query = search.trim().toLowerCase();
  const filtered = pharmacists.filter(
    (pharmacy) =>
      !query ||
      (pharmacy.name || '').toLowerCase().includes(query) ||
      (pharmacy.address || '').toLowerCase().includes(query),
  );

  function sendMessage() {
    if (!messageText.trim()) return;
    toast(`Message dispatched to ${messageFor.name}`);
    setMessageFor(null);
    setMessageText('');
  }

  const toggle = (pharmacy, key, label) => (
    <Button
      key={key}
      size="xs"
      variant="secondary"
      aria-pressed={pharmacy[key]}
      onClick={() => onToggle(pharmacy._id, key, !pharmacy[key])}
      className={cn(
        pharmacy[key] && key === 'isVerified' && 'border-success/30 bg-success/10 text-success hover:bg-success/15',
        pharmacy[key] && key === 'isPremium' && 'border-accent/30 bg-accent/10 text-accent-ink hover:bg-accent/15',
        pharmacy[key] && key === 'isSuspended' && 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
      )}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 max-w-md flex-1 items-center gap-2 rounded-field border border-line-strong/70 bg-surface px-3.5 text-muted focus-within:border-accent">
          <Icons.Search />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dispensary, sector or address…"
            aria-label="Search dispensaries"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
        <span className="text-xs text-muted">
          <span className="tnum">{filtered.length}</span> listed
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No dispensary matches that search"
          description="Try a sector number, a landmark, or part of the store name."
          icon={Icons.Search}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pharmacy) => (
            <Card
              key={pharmacy._id}
              hover
              className={cn('p-4', pharmacy.isSuspended && 'border-danger/25 opacity-80')}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-[11px] font-semibold text-accent-ink">
                    {pharmacy.name.substring(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{pharmacy.name}</span>
                      {pharmacy.isVerified && <Badge tone="success">Verified</Badge>}
                      {pharmacy.isPremium && <Badge tone="accent">Premium</Badge>}
                      {pharmacy.isFeatured && <Badge tone="warning">Featured</Badge>}
                      {pharmacy.isSuspended && <Badge tone="danger">Suspended</Badge>}
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{pharmacy.address}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {pharmacy.contact} · {pharmacy.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {toggle(pharmacy, 'isVerified', pharmacy.isVerified ? 'Verified' : 'Verify')}
                  {toggle(pharmacy, 'isPremium', pharmacy.isPremium ? 'Premium' : 'Grant premium')}
                  {toggle(pharmacy, 'isSuspended', pharmacy.isSuspended ? 'Unsuspend' : 'Suspend')}
                  <Button size="xs" variant="secondary" onClick={() => setMessageFor(pharmacy)}>
                    Message
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(messageFor)}
        onClose={() => setMessageFor(null)}
        title={messageFor ? `Contact ${messageFor.name}` : 'Contact dispensary'}
        description="Send an administrative notice or a stock verification request to this pharmacy portal."
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setMessageFor(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={sendMessage} disabled={!messageText.trim()}>
              Dispatch message
            </Button>
          </>
        }
      >
        <Field label="Message" hint="Pharmacists see this in their portal inbox.">
          {(field) => (
            <Textarea
              {...fieldProps(field)}
              rows={4}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="e.g. Please verify live strip count for Paracetamol 650mg and Cetirizine."
            />
          )}
        </Field>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. MediPoints
// ══════════════════════════════════════════════════════════════════
function PointsTab({ toast }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [amount, setAmount] = useState('50');
  const [reason, setReason] = useState('');
  const [actionType, setActionType] = useState('award');
  const [userBalance, setUserBalance] = useState({
    name: 'Demo patient',
    email: 'patient@nsut.ac.in',
    points: 240,
  });
  const [auditLog, setAuditLog] = useState([
    { email: 'kunal.v@nsut.ac.in', delta: 20, reason: 'Approved Paracetamol bill audit', at: 'just now' },
    { email: 'priya.s@gmail.com', delta: 20, reason: 'Approved Metformin price proof', at: '4 min ago' },
  ]);

  function adjustPoints() {
    const magnitude = Math.abs(Number(amount));
    if (!magnitude) return;
    const delta = actionType === 'award' ? magnitude : -magnitude;
    setUserBalance((previous) => ({ ...previous, points: Math.max(0, previous.points + delta) }));
    setAuditLog((previous) => [
      { email: userBalance.email, delta, reason: reason || 'Manual admin adjustment', at: 'just now' },
      ...previous,
    ]);
    toast(`${delta > 0 ? 'Awarded' : 'Deducted'} ${magnitude} points`);
    setReason('');
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-ink">Patient balance lookup</h3>
          <p className="mt-1 text-[11px] text-muted">Search by email or phone before adjusting a balance.</p>

          <div className="mt-4 flex items-end gap-2">
            <Field label="Patient identifier" className="flex-1">
              {(field) => (
                <Input
                  {...fieldProps(field)}
                  type="search"
                  value={searchEmail}
                  onChange={(event) => setSearchEmail(event.target.value)}
                  placeholder="email or phone"
                />
              )}
            </Field>
            <Button
              size="sm"
              variant="primary"
              className="mb-0.5"
              onClick={() => toast(`Loaded account for ${searchEmail || userBalance.email}`)}
            >
              Search
            </Button>
          </div>

          <Card tone="sunken" className="mt-4 p-5 text-center">
            <p className="text-[11px] text-muted">
              {userBalance.name} · {userBalance.email}
            </p>
            <div className="my-2 text-4xl font-light tracking-[-0.04em] text-accent-ink">
              <NumberTicker value={userBalance.points} />
            </div>
            <Badge tone="accent" dot>
              Verified MediPoints balance
            </Badge>
          </Card>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-ink">Grant or deduct points</h3>
          <p className="mt-1 text-[11px] text-muted">Every adjustment is written to the session audit log.</p>

          <div className="mt-4 space-y-3">
            <SegmentedControl
              options={[
                { id: 'award', label: 'Award' },
                { id: 'deduct', label: 'Deduct' },
              ]}
              value={actionType}
              onChange={setActionType}
              label="Adjustment direction"
            />

            <Field label="Points">
              {(field) => (
                <Input
                  {...fieldProps(field)}
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              )}
            </Field>

            <Field label="Reason" hint="Shown to the patient in their points history.">
              {(field) => (
                <Input
                  {...fieldProps(field)}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Receipt bonus, referral…"
                />
              )}
            </Field>

            <Button
              variant={actionType === 'award' ? 'primary' : 'danger'}
              size="sm"
              className="w-full"
              onClick={adjustPoints}
            >
              {actionType === 'award' ? 'Award' : 'Deduct'} {amount || 0} points
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Session audit log</h4>
          <span className="text-[11px] text-muted">
            <span className="tnum">{auditLog.length}</span> entries
          </span>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {auditLog.map((entry, index) => (
            <li key={`${entry.email}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <span className="block truncate text-xs font-medium text-ink">{entry.email}</span>
                <span className="text-[11px] text-muted">
                  {entry.reason} · {entry.at}
                </span>
              </div>
              <Badge tone={entry.delta > 0 ? 'success' : 'danger'}>
                {entry.delta > 0 ? `+${entry.delta}` : entry.delta} pts
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. Coupons
// ══════════════════════════════════════════════════════════════════
function CouponsTab({ coupons, onCreate, onDelete, toast }) {
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('20');
  const [validDays, setValidDays] = useState('30');

  function createCoupon() {
    const finalCode = (code || `MEDI${discount}_${Math.floor(Math.random() * 900 + 100)}`).toUpperCase().trim();
    onCreate({
      _id: `c_${Date.now()}`,
      code: finalCode,
      discount: Number(discount),
      isUsed: false,
      expiresAt: new Date(Date.now() + 86400000 * Number(validDays)).toISOString(),
      isAdminCoupon: true,
    });
    toast(`Voucher ${finalCode} generated`);
    setShowCreate(false);
    setCode('');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">Partner dispensary vouchers</h3>
          <p className="mt-1 text-[11px] text-muted">Benchmark discount vouchers redeemable by patients.</p>
        </div>
        <Button size="sm" variant={showCreate ? 'secondary' : 'primary'} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close form' : 'Generate voucher'}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Card className="border-accent/30 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Discount">
                  {(field) => (
                    <Select
                      {...fieldProps(field)}
                      value={discount}
                      onChange={(event) => setDiscount(event.target.value)}
                    >
                      <option value="10">10% off</option>
                      <option value="15">15% off</option>
                      <option value="20">20% off</option>
                      <option value="30">30% off</option>
                      <option value="50">50% off — VIP</option>
                    </Select>
                  )}
                </Field>

                <Field label="Validity (days)">
                  {(field) => (
                    <Input
                      {...fieldProps(field)}
                      type="number"
                      min="1"
                      value={validDays}
                      onChange={(event) => setValidDays(event.target.value)}
                    />
                  )}
                </Field>

                <Field label="Custom code" hint="Blank generates one automatically.">
                  {(field) => (
                    <Input
                      {...fieldProps(field)}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="DWARKA30"
                      className="font-mono uppercase"
                    />
                  )}
                </Field>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={createCoupon}>
                  Confirm voucher
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {coupons.length === 0 ? (
        <EmptyState
          title="No vouchers in circulation"
          description="Generate a voucher to run a discount campaign for partner dispensaries."
          icon={Icons.Coupons}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => {
            const expired = new Date(coupon.expiresAt) < new Date();
            const dead = coupon.isUsed || expired;
            return (
              <Card
                key={coupon._id}
                hover
                className={cn('flex flex-col justify-between p-4', dead && 'opacity-70')}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-base font-semibold tracking-[0.08em] text-accent-ink">
                      {coupon.code}
                    </span>
                    <Badge tone={coupon.isUsed ? 'neutral' : expired ? 'danger' : 'success'}>
                      {coupon.isUsed ? 'Claimed' : expired ? 'Expired' : `${coupon.discount}% off`}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    Expires <span className="tnum">{new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</span>
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText(coupon.code);
                      toast(`Copied ${coupon.code}`);
                    }}
                  >
                    Copy code
                  </Button>
                  <Button size="xs" variant="link" className="text-danger hover:text-danger" onClick={() => onDelete(coupon._id)}>
                    Revoke
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 6. Broadcast
// ══════════════════════════════════════════════════════════════════
function BroadcastTab({ broadcasts, onSend, toast }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [type, setType] = useState('info');

  function dispatchAlert() {
    if (!message.trim()) {
      toast('Enter an alert message first', 'error');
      return;
    }
    onSend({
      _id: `b_${Date.now()}`,
      title: title.trim() || 'Network announcement',
      message: message.trim(),
      target,
      type,
      createdAt: new Date().toISOString(),
    });
    toast(`Alert dispatched to ${target}`);
    setTitle('');
    setMessage('');
  }

  return (
    <div className="space-y-5">
      <CardSpotlight className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-ink">Dispatch a community alert</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted">
              Critical notices, medicine availability and policy updates appear as banners across the patient and
              pharmacist apps.
            </p>
          </div>
          <Badge tone={type === 'alert' ? 'danger' : type === 'promo' ? 'warning' : 'accent'} dot>
            {type}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Headline" hint="Blank falls back to a generic announcement title.">
            {(field) => (
              <Input
                {...fieldProps(field)}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Paracetamol stock verified in Dwarka Sector 3"
              />
            )}
          </Field>

          <Field label="Message" required>
            {(field) => (
              <Textarea
                {...fieldProps(field)}
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What should people know, and what should they do next?"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Audience">
              {(field) => (
                <Select
                    {...fieldProps(field)}
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                  >
                  <option value="all">Entire network</option>
                  <option value="customers">Patients only</option>
                  <option value="pharmacists">Pharmacists only</option>
                </Select>
              )}
            </Field>

            <Field label="Classification">
              {(field) => (
                <Select
                    {...fieldProps(field)}
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                  >
                  <option value="info">Informational bulletin</option>
                  <option value="alert">High-priority health advisory</option>
                  <option value="promo">MediPoints incentive campaign</option>
                </Select>
              )}
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <ShimmerButton type="button" onClick={dispatchAlert}>
              Broadcast bulletin
            </ShimmerButton>
          </div>
        </div>
      </CardSpotlight>

      <div className="space-y-3">
        <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Past dispatches</h4>
        {broadcasts.length === 0 ? (
          <EmptyState
            title="Nothing broadcast yet"
            description="Sent alerts appear here with their audience and classification."
            icon={Icons.Broadcast}
          />
        ) : (
          broadcasts.map((broadcast) => (
            <Card key={broadcast._id} hover className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-sm font-medium text-ink">{broadcast.title}</span>
                <Badge tone={broadcast.type === 'alert' ? 'danger' : broadcast.type === 'promo' ? 'warning' : 'accent'}>
                  {broadcast.type} · {broadcast.target}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{broadcast.message}</p>
              <span className="mt-2 block text-[10px] text-muted tnum">
                {new Date(broadcast.createdAt).toLocaleDateString('en-IN')}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Root
// ══════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [toast, setToast] = useState(null);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [pharmacists, setPharmacists] = useState(INITIAL_PHARMACISTS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [broadcasts, setBroadcasts] = useState(INITIAL_BROADCASTS);

  const { dark, toggleTheme } = useTheme();

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
  }

  function approveSubmission(id) {
    setSubmissions((previous) => previous.map((item) => (item._id === id ? { ...item, status: 'approved' } : item)));
    setStats((previous) => ({
      ...previous,
      pending: Math.max(0, previous.pending - 1),
      pointsDistributed: previous.pointsDistributed + 20,
    }));
    showToast('Submission approved · 20 MediPoints credited');
  }

  function rejectSubmission(id) {
    setSubmissions((previous) => previous.map((item) => (item._id === id ? { ...item, status: 'rejected' } : item)));
    setStats((previous) => ({ ...previous, pending: Math.max(0, previous.pending - 1) }));
    showToast('Submission rejected', 'error');
  }

  function togglePharmacistFlag(id, field, value) {
    setPharmacists((previous) => previous.map((item) => (item._id === id ? { ...item, [field]: value } : item)));
    showToast('Dispensary updated');
  }

  function createCoupon(coupon) {
    setCoupons((previous) => [coupon, ...previous]);
  }

  function deleteCoupon(id) {
    setCoupons((previous) => previous.filter((coupon) => coupon._id !== id));
    showToast('Coupon revoked');
  }

  function sendBroadcast(broadcast) {
    setBroadcasts((previous) => [broadcast, ...previous]);
  }

  function submitKey(event) {
    event.preventDefault();
    if (keyInput === ADMIN_KEY) {
      setAuth(true);
      setKeyError('');
      return;
    }
    setKeyError('That key does not match. Demo key: admin123');
  }

  // ── Gate ────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16">
        <GridPattern className="opacity-[0.35] mask-fade-b" />
        <Lamp width="44rem" height="26rem" />
        <Spotlight className="pointer-events-none -top-40 left-0 hidden opacity-25 dark:block md:-top-20 md:left-60" fill="rgb(var(--accent))" />

        <div className="relative z-10 w-full max-w-sm animate-fade-up">
          <div className="mb-7 text-center">
            <div className="mb-3 inline-block">
              <Logo size={42} textSize="text-2xl" />
            </div>
            <Badge tone="accent" dot>
              <Icons.Shield />
              Super administrator
            </Badge>
          </div>

          <CardSpotlight className="rounded-panel p-7 shadow-float">
            <h1 className="text-base font-medium text-ink">Verify administrator access</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Enter the master secret to reach MediMap infrastructure controls.
            </p>

            <form onSubmit={submitKey} className="mt-5 space-y-4">
              <Field label="Master secret" error={keyError || undefined}>
                {(field) => (
                  <Input
                    {...fieldProps(field)}
                    invalid={field.invalid}
                    autoFocus
                    type="password"
                    value={keyInput}
                    onChange={(event) => {
                      setKeyInput(event.target.value);
                      setKeyError('');
                    }}
                    placeholder="••••••••"
                    className="font-mono"
                  />
                )}
              </Field>

              <ShimmerButton type="submit" className="w-full">
                Authenticate session
              </ShimmerButton>
            </form>

            <div className="mt-6 border-t border-line pt-4 text-center">
              <p className="text-[11px] text-muted">
                Demo credential <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-accent-ink">admin123</code>
              </p>
              <Link to="/" className="link-quiet mt-2">
                Back to MediMap
              </Link>
            </div>
          </CardSpotlight>
        </div>
      </main>
    );
  }

  // ── Console ────────────────────────────────────────────────────
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: <Icons.Analytics /> },
    { id: 'submissions', label: 'Price audits', icon: <Icons.Submissions />, count: stats.pending },
    { id: 'pharmacists', label: 'Dispensaries', icon: <Icons.Pharmacy /> },
    { id: 'points', label: 'MediPoints', icon: <Icons.Points /> },
    { id: 'coupons', label: 'Coupons', icon: <Icons.Coupons /> },
    { id: 'broadcast', label: 'Broadcast', icon: <Icons.Broadcast /> },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-16 pt-20 text-ink">
      <AnimatePresence>{toast && <Toast key="toast" msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        {/* Masthead */}
        <Card className="relative mb-6 overflow-hidden">
          <Lamp width="32rem" height="13rem" className="opacity-70" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-solid text-white shadow-card">
                <Icons.Shield />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-medium leading-tight text-ink">MediMap super admin</h1>
                  <Badge tone="success" dot>
                    Operational
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">
                  Dwarka and Delhi NCR healthcare affordability infrastructure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconButton
                size="sm"
                variant="secondary"
                aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={toggleTheme}
              >
                {dark ? (
                  <svg className="h-3.5 w-3.5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </IconButton>

              <Button to="/" size="sm" variant="secondary">
                Live site
              </Button>

              <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setAuth(false)}>
                <Icons.Logout />
                Log out
              </Button>
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-6" />

        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'analytics' && <AnalyticsTab stats={stats} />}
          {activeTab === 'submissions' && (
            <SubmissionsTab submissions={submissions} onApprove={approveSubmission} onReject={rejectSubmission} />
          )}
          {activeTab === 'pharmacists' && (
            <PharmacistsTab pharmacists={pharmacists} onToggle={togglePharmacistFlag} toast={showToast} />
          )}
          {activeTab === 'points' && <PointsTab toast={showToast} />}
          {activeTab === 'coupons' && (
            <CouponsTab coupons={coupons} onCreate={createCoupon} onDelete={deleteCoupon} toast={showToast} />
          )}
          {activeTab === 'broadcast' && (
            <BroadcastTab broadcasts={broadcasts} onSend={sendBroadcast} toast={showToast} />
          )}
        </div>
      </div>
    </div>
  );
}
